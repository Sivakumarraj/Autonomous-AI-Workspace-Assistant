"""Workflow planning and execution.

The suite runs with no GEMINI_API_KEY, so these cover the deterministic
fallback planner and the guarantee that AI steps degrade instead of crashing.
"""

import pytest

from app.workflows.planner import (
    _extract_json,
    _validate,
    fallback_plan,
    plan_workflow,
)
from app.workflows.step_catalog import CATALOG, run_step

# --- Planner validation: the security boundary --------------------------------


def test_unknown_actions_are_dropped():
    """The planner is an LLM, so its output is untrusted.

    An action not in the catalog must never reach the runner.
    """
    steps = _validate(
        [
            {"action": "run_terminal_command", "title": "pwn", "params": {}},
            {"action": "__import__", "title": "nope", "params": {}},
            {"action": "list_documents", "title": "ok", "params": {}},
        ]
    )

    assert [s.action for s in steps] == ["list_documents"]


def test_undeclared_params_are_stripped():
    """Only parameters the action declares survive validation."""
    steps = _validate(
        [
            {
                "action": "search_documents",
                "title": "search",
                "params": {"query": "resume", "cmd": "rm -rf /", "shell": True},
            }
        ]
    )

    assert steps[0].params == {"query": "resume"}


@pytest.mark.parametrize(
    "garbage",
    [None, "not a list", 42, [{"no_action": 1}], ["just a string"], [None]],
)
def test_malformed_plans_do_not_crash(garbage):
    assert _validate(garbage) == []


def test_plans_are_length_capped():
    steps = _validate([{"action": "list_documents", "params": {}}] * 50)
    assert len(steps) <= 6


# --- JSON extraction ----------------------------------------------------------


@pytest.mark.parametrize(
    "raw",
    [
        '{"steps": [{"action": "list_documents"}]}',
        '```json\n{"steps": [{"action": "list_documents"}]}\n```',
        '```\n{"steps": [{"action": "list_documents"}]}\n```',
        'Sure! Here is the plan:\n{"steps": [{"action": "list_documents"}]}',
    ],
)
def test_json_is_extracted_from_common_wrappers(raw):
    parsed = _extract_json(raw)
    assert parsed is not None
    assert parsed["steps"][0]["action"] == "list_documents"


@pytest.mark.parametrize("raw", ["", "no json at all", "{broken", "[]"])
def test_unparseable_output_returns_none(raw):
    assert _extract_json(raw) is None


# --- Fallback planner ---------------------------------------------------------


def test_fallback_plan_is_valid_and_actionable():
    steps = fallback_plan("Summarize docs", "Summarise everything uploaded")

    assert len(steps) >= 2
    # Every action it emits must exist in the catalog.
    assert all(step.action in CATALOG for step in steps)
    assert steps[-1].action == "write_note"


def test_fallback_plan_extracts_facts_when_asked():
    steps = fallback_plan("Learn my stack", "Extract facts into memory")
    assert any(step.action == "extract_facts" for step in steps)


async def test_plan_workflow_falls_back_without_an_api_key():
    """No key configured, so this must not raise — it degrades."""
    steps = await plan_workflow("Test", "Do something useful")

    assert steps
    assert all(step.action in CATALOG for step in steps)


# --- Step execution -----------------------------------------------------------


async def test_ai_steps_skip_cleanly_without_a_key():
    output = await run_step("write_note", {"instruction": "Write a report"}, "")

    assert "GEMINI_API_KEY" in output
    assert "Skipped" in output


async def test_non_ai_steps_run_without_a_key():
    output = await run_step("list_documents", {}, "")
    assert isinstance(output, str) and output


async def test_run_step_rejects_an_unknown_action():
    with pytest.raises(KeyError):
        await run_step("delete_everything", {}, "")


async def test_run_step_ignores_undeclared_params():
    """Extra params must not reach the underlying function as kwargs."""
    output = await run_step("list_documents", {"unexpected": "value"}, "")
    assert isinstance(output, str)


# --- Routes -------------------------------------------------------------------


def test_run_endpoint_plans_and_executes(client):
    created = client.post(
        "/workflows/",
        json={"name": "Doc report", "description": "Summarise the documents"},
    ).json()

    response = client.post(f"/workflows/{created['id']}/run")
    assert response.status_code == 202
    assert response.json()["workflow"]["status"] in {"planning", "running", "completed"}

    # TestClient runs background tasks synchronously on response teardown, so
    # by now the run has finished.
    workflow = client.get(f"/workflows/{created['id']}").json()
    assert workflow["status"] == "completed"
    assert workflow["steps_total"] > 0
    assert workflow["steps_done"] == workflow["steps_total"]
    assert workflow["progress"] == 100

    steps = client.get(f"/workflows/{created['id']}/steps").json()
    assert len(steps) == workflow["steps_total"]
    assert all(step["status"] == "completed" for step in steps)
    assert all(step["action"] in CATALOG for step in steps)


def test_running_a_missing_workflow_is_404(client):
    assert client.post("/workflows/999999/run").status_code == 404
    assert client.get("/workflows/999999/steps").status_code == 404


def test_rerun_replaces_the_previous_steps(client):
    created = client.post(
        "/workflows/", json={"name": "Rerun me", "description": "Summarise"}
    ).json()

    client.post(f"/workflows/{created['id']}/run")
    first = client.get(f"/workflows/{created['id']}/steps").json()

    client.post(f"/workflows/{created['id']}/run")
    second = client.get(f"/workflows/{created['id']}/steps").json()

    # Fresh rows, not appended to the old ones.
    assert len(second) == len(first)
    assert {s["id"] for s in first}.isdisjoint({s["id"] for s in second})


def test_deleting_a_workflow_removes_its_steps(client):
    created = client.post(
        "/workflows/", json={"name": "Temp", "description": "Summarise"}
    ).json()
    client.post(f"/workflows/{created['id']}/run")

    assert client.get(f"/workflows/{created['id']}/steps").json()

    client.delete(f"/workflows/{created['id']}")
    assert client.get(f"/workflows/{created['id']}/steps").status_code == 404


def test_interrupted_runs_are_reconciled():
    """A restart mid-run must not leave a workflow stuck on 'running'."""
    from app.database.workflow_db import (
        add_workflow,
        get_workflow,
        mark_running,
        reconcile_interrupted_runs,
    )

    workflow = add_workflow("Stuck", 3, "left mid-run")
    mark_running(workflow["id"])
    assert get_workflow(workflow["id"])["status"] == "running"

    assert reconcile_interrupted_runs() >= 1

    recovered = get_workflow(workflow["id"])
    assert recovered["status"] == "failed"
    assert "restart" in recovered["error"].lower()
