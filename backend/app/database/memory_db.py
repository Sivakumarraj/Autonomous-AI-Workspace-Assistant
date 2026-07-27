"""Persistence for workspace memory entries."""

from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.database.connection import get_conn

COLUMNS = "id, category, content, source, icon, created_at"


def _row_to_dict(row) -> Dict:
    return {
        "id": row["id"],
        "category": row["category"] or "",
        "content": row["content"],
        "source": row["source"] or "",
        "icon": row["icon"] or "",
        "created_at": row["created_at"] or "",
    }


def add_memory(
    category: str,
    content: str,
    source: str = "chat",
    created_at: Optional[str] = None,
    icon: str = "",
) -> Dict:
    """Insert a memory and return the stored row."""
    created_at = created_at or datetime.now(timezone.utc).isoformat()

    with get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO memories (category, content, source, icon, created_at) "
            "VALUES (?,?,?,?,?)",
            (category, content, source, icon, created_at),
        )
        row = conn.execute(
            f"SELECT {COLUMNS} FROM memories WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return _row_to_dict(row)


def save_memory(category: str, content: str, source: str = "chat") -> Dict:
    """Backwards-compatible alias for add_memory."""
    return add_memory(category, content, source)


def get_memories(limit: Optional[int] = None) -> List[Dict]:
    query = f"SELECT {COLUMNS} FROM memories ORDER BY id DESC"
    params: tuple = ()

    if limit is not None:
        query += " LIMIT ?"
        params = (limit,)

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()

    return [_row_to_dict(row) for row in rows]


def get_memory(memory_id: int) -> Optional[Dict]:
    with get_conn() as conn:
        row = conn.execute(
            f"SELECT {COLUMNS} FROM memories WHERE id = ?", (memory_id,)
        ).fetchone()

    return _row_to_dict(row) if row else None


def delete_memory(memory_id: int) -> bool:
    """Delete a memory. Returns True if a row was actually removed."""
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
        return cursor.rowcount > 0


def get_memories_count() -> int:
    with get_conn() as conn:
        return conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
