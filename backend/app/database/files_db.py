import sqlite3, os
from datetime import datetime

DB_PATH = "database/nexus.db"
os.makedirs("database", exist_ok=True)

def init_files_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            status TEXT DEFAULT 'ready',
            uploaded_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def add_file(file_data: dict):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO files (filename, status, uploaded_at) VALUES (?,?,?)",
        (file_data["filename"], file_data.get("status","ready"), datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def get_files():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT id, filename, status, uploaded_at FROM files ORDER BY id DESC").fetchall()
    conn.close()
    return [{"id": r[0], "filename": r[1], "status": r[2], "uploaded_at": r[3]} for r in rows]

def get_files_count():
    conn = sqlite3.connect(DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
    conn.close()
    return count

init_files_db()