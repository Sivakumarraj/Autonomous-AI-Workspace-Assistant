"""Routes a natural-language task to a tool-backed workflow."""

from typing import Any

from anyio import to_thread

from app.agents.planner_agent import planner_agent
from app.core.config import settings
from app.core.logging import get_logger
from app.tools.file_tool import list_uploaded_files
from app.tools.terminal_tool import run_terminal_command

logger = get_logger(__name__)

BROWSER_STEPS = frozenset({"google_search", "extract_webpage", "summarize_webpage"})


class WorkflowEngine:
    """Executes the step list produced by the planner agent."""

    async def execute(self, task: str) -> dict[str, Any]:
        plan = await planner_agent.create_plan(task)

        # `general_chat` means the planner found no workflow; hand straight back
        # to the chat route rather than running an empty plan.
        if plan == ["general_chat"]:
            return {"workflow": "unknown", "result": None}

        results: list[dict[str, Any]] = []

        for step in plan:
            if step == "list_files":
                results.append(
                    {
                        "step": step,
                        "output": await to_thread.run_sync(list_uploaded_files),
                    }
                )

            elif step == "execute_terminal":
                command = task[len("run command") :].strip()
                results.append(
                    {
                        "step": step,
                        "output": await to_thread.run_sync(
                            run_terminal_command, command
                        ),
                    }
                )

            elif step in BROWSER_STEPS:
                results.append({"step": step, "output": await self._browse(task)})

            else:
                # Planner emitted a step with no implementation (the resume
                # analysis plan does this). Report it rather than dropping it.
                logger.info("Step %r is not implemented, skipping", step)
                results.append(
                    {
                        "step": step,
                        "output": {
                            "status": "not_implemented",
                            "detail": f"Step {step!r} has no implementation yet.",
                        },
                    }
                )

        if not results:
            return {"workflow": "unknown", "result": None}

        return {"workflow": "planned_execution", "result": results}

    async def _browse(self, task: str) -> dict[str, Any]:
        """Run a browser workflow, or explain why it is unavailable.

        Playwright and its Chromium download are not part of the default image,
        so this is imported lazily and gated on the feature flag.
        """
        if not settings.ENABLE_BROWSER_TOOL:
            return {
                "status": "disabled",
                "detail": (
                    "Browser automation is disabled. Set ENABLE_BROWSER_TOOL=true "
                    "and run `playwright install chromium` to enable it."
                ),
            }

        try:
            from app.workflows.browser_workflow import browser_workflow

            return await browser_workflow.run(task)
        except Exception as exc:
            logger.exception("Browser workflow failed")
            return {"status": "error", "detail": str(exc)}


workflow_engine = WorkflowEngine()
