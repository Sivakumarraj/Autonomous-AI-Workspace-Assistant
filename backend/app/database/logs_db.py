"""Persistence for system activity logs."""

from datetime import datetime, timezone
from typing import Dict, List

from app.database.connection import get_conn

COLUMNS = "id, event, category, level, created_at"


def _row_to_dict(row) -> Dict:
    return {
        "id": row["id"],
        "event": row["event"],
        "category": row["category"] or "System",
        "level": row["level"] or "info",
        "created_at": row["created_at"] or "",
    }


def add_log(category: str, event: str, level: str = "info") -> Dict:
    """Record an activity log entry. Note the (category, event) argument order."""
    with get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO logs (event, category, level, created_at) VALUES (?,?,?,?)",
            (event, category, level, datetime.now(timezone.utc).isoformat()),
        )
        row = conn.execute(
            f"SELECT {COLUMNS} FROM logs WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return _row_to_dict(row)


def save_log(event: str, category: str = "System", level: str = "info") -> Dict:
    """Same as add_log with (event, category) ordering, kept for existing callers."""
    return add_log(category, event, level)


def get_logs(limit: int = 50) -> List[Dict]:
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT {COLUMNS} FROM logs ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()

    return [_row_to_dict(row) for row in rows]


def get_logs_today_count() -> int:
    # Timestamps are written in UTC, so the day boundary must be UTC too.
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    with get_conn() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM logs WHERE created_at LIKE ?", (f"{today}%",)
        ).fetchone()[0]


def get_logs_count() -> int:
    with get_conn() as conn:
        return conn.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
