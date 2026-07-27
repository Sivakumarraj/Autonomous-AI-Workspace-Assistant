"""Persistence for workflow definitions, their steps, and run progress."""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.database.connection import get_conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

COLUMNS = (
    "id, name, description, status, steps_total, steps_done, "
    "error, started_at, finished_at, created_at"
)

STEP_COLUMNS = (
    "id, workflow_id, position, action, title, params, status, "
    "output, error, started_at, finished_at"
)

# Statuses a workflow can be in. `active` means created but never run.
RUNNABLE_STATUSES = {"active", "completed", "failed", "paused"}
IN_FLIGHT_STATUSES = {"planning", "running"}


def _row_to_dict(row) -> Dict:
    steps_total = row["steps_total"] or 0
    steps_done = row["steps_done"] or 0

    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"] or "",
        "status": row["status"] or "active",
        "steps_total": steps_total,
        "steps_done": steps_done,
        "progress": round(steps_done / steps_total * 100) if steps_total else 0,
        "error": row["error"] or "",
        "started_at": row["started_at"] or "",
        "finished_at": row["finished_at"] or "",
        "created_at": row["created_at"] or "",
    }


def _step_to_dict(row) -> Dict:
    try:
        params = json.loads(row["params"] or "{}")
    except json.JSONDecodeError:
        params = {}

    return {
        "id": row["id"],
        "workflow_id": row["workflow_id"],
        "position": row["position"],
        "action": row["action"],
        "title": row["title"] or row["action"],
        "params": params,
        "status": row["status"] or "pending",
        "output": row["output"] or "",
        "error": row["error"] or "",
        "started_at": row["started_at"] or "",
        "finished_at": row["finished_at"] or "",
    }


def add_workflow(
    name: str,
    steps_total: int = 0,
    description: str = "",
    status: str = "active",
) -> Dict:
    with get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO workflows "
            "(name, description, status, steps_total, steps_done, created_at) "
            "VALUES (?,?,?,?,?,?)",
            (
                name,
                description,
                status,
                steps_total,
                0,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        row = conn.execute(
            f"SELECT {COLUMNS} FROM workflows WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return _row_to_dict(row)


def get_workflows() -> List[Dict]:
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT {COLUMNS} FROM workflows ORDER BY id DESC"
        ).fetchall()

    return [_row_to_dict(row) for row in rows]


def get_workflow(workflow_id: int) -> Optional[Dict]:
    with get_conn() as conn:
        row = conn.execute(
            f"SELECT {COLUMNS} FROM workflows WHERE id = ?", (workflow_id,)
        ).fetchone()

    return _row_to_dict(row) if row else None


def update_workflow(workflow_id: int, **fields) -> Optional[Dict]:
    """Update any of the workflow's mutable columns."""
    allowed = {
        "name",
        "description",
        "status",
        "steps_total",
        "steps_done",
        "error",
        "started_at",
        "finished_at",
    }
    updates = {key: value for key, value in fields.items() if key in allowed}

    if not updates:
        return get_workflow(workflow_id)

    assignments = ", ".join(f"{key} = ?" for key in updates)
    params = list(updates.values()) + [workflow_id]

    with get_conn() as conn:
        cursor = conn.execute(
            f"UPDATE workflows SET {assignments} WHERE id = ?", params
        )
        if cursor.rowcount == 0:
            return None
        row = conn.execute(
            f"SELECT {COLUMNS} FROM workflows WHERE id = ?", (workflow_id,)
        ).fetchone()

    return _row_to_dict(row)


def delete_workflow(workflow_id: int) -> bool:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
        return cursor.rowcount > 0


def get_active_workflows_count() -> int:
    with get_conn() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM workflows WHERE status = 'active'"
        ).fetchone()[0]


def get_completed_workflows_count() -> int:
    with get_conn() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM workflows WHERE status = 'completed'"
        ).fetchone()[0]


# --- Steps --------------------------------------------------------------------


def replace_steps(workflow_id: int, steps: List[Dict[str, Any]]) -> List[Dict]:
    """Store a freshly planned set of steps, discarding any previous run.

    Re-running a workflow re-plans it, so old step rows would otherwise
    accumulate and the progress counter would be meaningless.
    """
    with get_conn() as conn:
        conn.execute("DELETE FROM workflow_steps WHERE workflow_id = ?", (workflow_id,))

        for position, step in enumerate(steps):
            conn.execute(
                "INSERT INTO workflow_steps "
                "(workflow_id, position, action, title, params, status) "
                "VALUES (?,?,?,?,?,'pending')",
                (
                    workflow_id,
                    position,
                    step["action"],
                    step.get("title", step["action"]),
                    json.dumps(step.get("params", {})),
                ),
            )

        conn.execute(
            "UPDATE workflows SET steps_total = ?, steps_done = 0 WHERE id = ?",
            (len(steps), workflow_id),
        )

    return get_steps(workflow_id)


def get_steps(workflow_id: int) -> List[Dict]:
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT {STEP_COLUMNS} FROM workflow_steps "
            "WHERE workflow_id = ? ORDER BY position",
            (workflow_id,),
        ).fetchall()

    return [_step_to_dict(row) for row in rows]


def start_step(step_id: int) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE workflow_steps SET status = 'running', started_at = ? WHERE id = ?",
            (_now(), step_id),
        )


def finish_step(step_id: int, output: str = "", error: str = "") -> None:
    """Mark a step done. A non-empty `error` marks it failed."""
    with get_conn() as conn:
        conn.execute(
            "UPDATE workflow_steps "
            "SET status = ?, output = ?, error = ?, finished_at = ? WHERE id = ?",
            (
                "failed" if error else "completed",
                output,
                error,
                _now(),
                step_id,
            ),
        )


def bump_steps_done(workflow_id: int) -> None:
    """Increment progress, never past the total."""
    with get_conn() as conn:
        conn.execute(
            "UPDATE workflows "
            "SET steps_done = MIN(steps_done + 1, steps_total) WHERE id = ?",
            (workflow_id,),
        )


def mark_running(workflow_id: int) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE workflows "
            "SET status = 'running', error = '', started_at = ?, finished_at = NULL "
            "WHERE id = ?",
            (_now(), workflow_id),
        )


def mark_finished(workflow_id: int, status: str, error: str = "") -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE workflows SET status = ?, error = ?, finished_at = ? WHERE id = ?",
            (status, error, _now(), workflow_id),
        )


def reconcile_interrupted_runs() -> int:
    """Fail any run left mid-flight by a restart.

    Execution happens in an in-process background task, so a deploy or crash
    during a run would otherwise leave the workflow stuck showing 'running'
    forever with nothing driving it.
    """
    with get_conn() as conn:
        cursor = conn.execute(
            "UPDATE workflows SET status = 'failed', "
            "error = 'Interrupted by a server restart', finished_at = ? "
            "WHERE status IN ('running', 'planning')",
            (_now(),),
        )
        conn.execute(
            "UPDATE workflow_steps SET status = 'failed', "
            "error = 'Interrupted by a server restart', finished_at = ? "
            "WHERE status = 'running'",
            (_now(),),
        )
        return cursor.rowcount
