"""Persistence for uploaded file metadata."""

from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.database.connection import get_conn

COLUMNS = "id, filename, stored_name, size_bytes, chunk_count, status, uploaded_at"


def _row_to_dict(row) -> Dict:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "stored_name": row["stored_name"] or "",
        "size_bytes": row["size_bytes"] or 0,
        "chunk_count": row["chunk_count"] or 0,
        "status": row["status"] or "ready",
        "uploaded_at": row["uploaded_at"] or "",
    }


def add_file(file_data: Dict) -> Dict:
    """Insert file metadata and return the stored row."""
    with get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO files "
            "(filename, stored_name, size_bytes, chunk_count, status, uploaded_at) "
            "VALUES (?,?,?,?,?,?)",
            (
                file_data["filename"],
                file_data.get("stored_name", ""),
                file_data.get("size_bytes", 0),
                file_data.get("chunk_count", 0),
                file_data.get("status", "ready"),
                file_data.get("uploaded_at")
                or datetime.now(timezone.utc).isoformat(),
            ),
        )
        row = conn.execute(
            f"SELECT {COLUMNS} FROM files WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return _row_to_dict(row)


def get_files() -> List[Dict]:
    with get_conn() as conn:
        rows = conn.execute(f"SELECT {COLUMNS} FROM files ORDER BY id DESC").fetchall()

    return [_row_to_dict(row) for row in rows]


def get_file(file_id: int) -> Optional[Dict]:
    with get_conn() as conn:
        row = conn.execute(
            f"SELECT {COLUMNS} FROM files WHERE id = ?", (file_id,)
        ).fetchone()

    return _row_to_dict(row) if row else None


def delete_file(file_id: int) -> bool:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
        return cursor.rowcount > 0


def get_files_count() -> int:
    with get_conn() as conn:
        return conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
