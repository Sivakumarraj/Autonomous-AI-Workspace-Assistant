"""
Turns a workflow's name and description into a concrete, executable plan.

Gemini proposes the steps; this module decides what is allowed to run. Model
output is untrusted input, so every action is checked against CATALOG and every
parameter is filtered to the keys that action declares. An unknown action is
dropped, not executed.

When no API key is configured the planner falls back to a deterministic
keyword-based plan, so the feature degrades instead of failing outright.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.services.gemini_service import generate_response
from app.workflows.step_catalog import CATALOG, catalog_prompt

logger = get_logger(__name__)

MAX_STEPS = 6


@dataclass
class PlannedStep:
    action: str
    title: str
    params: dict[str, Any]


PLANNER_PROMPT = """You plan workflows for a document-intelligence assistant.

Available actions:
{catalog}

Workflow name: {name}
Workflow description: {description}

Produce a plan of between 2 and {max_steps} steps that accomplishes this
workflow using ONLY the actions listed above.

Rules:
- Use only action names from the list. Never invent one.
- Order matters: earlier step results are passed to later steps.
- Prefer ending with "write_note" to pull the findings together.
- Keep each title under 60 characters.

Respond with JSON only, no prose and no code fences:
{{"steps": [{{"action": "<action>", "title": "<short title>", "params": {{}}}}]}}"""


def _extract_json(raw: str) -> dict[str, Any] | None:
    """Pull a JSON object out of a model response.

    Models wrap JSON in ```json fences often enough that stripping them is
    worth doing before giving up.
    """
    text = raw.strip()

    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    # Last resort: the outermost {...} span.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None

    return None


def _validate(raw_steps: Any) -> list[PlannedStep]:
    """Keep only steps naming a real action, with only that action's params."""
    if not isinstance(raw_steps, list):
        return []

    steps: list[PlannedStep] = []

    for entry in raw_steps[:MAX_STEPS]:
        if not isinstance(entry, dict):
            continue

        action = str(entry.get("action", "")).strip()
        spec = CATALOG.get(action)
        if spec is None:
            logger.warning("Planner proposed unknown action %r, dropping it", action)
            continue

        raw_params = entry.get("params")
        params = raw_params if isinstance(raw_params, dict) else {}

        steps.append(
            PlannedStep(
                action=action,
                title=str(entry.get("title") or spec.description)[:120],
                # Only declared parameters survive, and only as strings.
                params={
                    key: str(value)
                    for key, value in params.items()
                    if key in spec.params and value is not None
                },
            )
        )

    return steps


def fallback_plan(name: str, description: str) -> list[PlannedStep]:
    """Deterministic plan used when Gemini is unavailable or unhelpful.

    Keyword-matched rather than clever — the point is that a workflow still
    does something sensible with no API key configured.
    """
    text = f"{name} {description}".lower()
    topic = name.strip() or "the documents"

    steps = [
        PlannedStep(
            action="list_documents",
            title="List available documents",
            params={},
        ),
        PlannedStep(
            action="search_documents",
            title=f"Find content about {topic}"[:120],
            params={"query": topic},
        ),
    ]

    if any(word in text for word in ("memory", "fact", "extract", "remember", "learn")):
        steps.append(
            PlannedStep(
                action="extract_facts",
                title="Extract facts into memory",
                params={"query": topic, "category": "General Knowledge"},
            )
        )
    else:
        steps.append(
            PlannedStep(
                action="summarize_documents",
                title="Summarise the findings",
                params={"query": topic},
            )
        )

    steps.append(
        PlannedStep(
            action="write_note",
            title="Write the final report",
            params={
                "instruction": (
                    f"Write a short report for the workflow '{name}'. "
                    f"{description}".strip()
                )
            },
        )
    )

    return steps


async def plan_workflow(name: str, description: str) -> list[PlannedStep]:
    """Produce a validated, executable plan for a workflow."""
    if not settings.gemini_configured:
        logger.info("No API key configured, using the deterministic fallback plan")
        return fallback_plan(name, description)

    prompt = PLANNER_PROMPT.format(
        catalog=catalog_prompt(),
        name=name,
        description=description or "(no description given)",
        max_steps=MAX_STEPS,
    )

    try:
        raw = await generate_response(prompt)
    except Exception:
        logger.exception("Planner call failed, falling back")
        return fallback_plan(name, description)

    parsed = _extract_json(raw)
    if parsed is None:
        logger.warning("Planner returned unparseable output, falling back")
        return fallback_plan(name, description)

    steps = _validate(parsed.get("steps"))

    if not steps:
        logger.warning("Planner produced no usable steps, falling back")
        return fallback_plan(name, description)

    return steps
