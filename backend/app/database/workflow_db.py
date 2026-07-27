"""Persistence for workflow definitions and their progress."""

from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.database.connection import get_conn

COLUMNS = "id, name, description, status, steps_total, steps_done, created_at"


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
        "created_at": row["created_at"] or "",
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
    """Update any of name/description/status/steps_total/steps_done."""
    allowed = {"name", "description", "status", "steps_total", "steps_done"}
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
