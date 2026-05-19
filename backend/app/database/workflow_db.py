import sqlite3, os
from datetime import datetime

DB_PATH = "database/nexus.db"
os.makedirs("database", exist_ok=True)

def init_workflow_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS workflows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            steps_total INTEGER DEFAULT 0,
            steps_done INTEGER DEFAULT 0,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def add_workflow(name: str, steps_total: int = 0):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO workflows (name, status, steps_total, steps_done, created_at) VALUES (?,?,?,?,?)",
        (name, "active", steps_total, 0, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def get_workflows():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT id, name, status, steps_total, steps_done, created_at FROM workflows ORDER BY id DESC").fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "status": r[2], "steps_total": r[3], "steps_done": r[4], "created_at": r[5]} for r in rows]

def get_active_workflows_count():
    conn = sqlite3.connect(DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM workflows WHERE status='active'").fetchone()[0]
    conn.close()
    return count

init_workflow_db()