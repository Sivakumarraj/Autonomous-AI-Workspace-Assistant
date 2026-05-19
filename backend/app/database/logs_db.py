import sqlite3, os
from datetime import datetime

DB_PATH = "database/nexus.db"
os.makedirs("database", exist_ok=True)

def init_logs_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT NOT NULL,
            category TEXT DEFAULT 'System',
            level TEXT DEFAULT 'info',
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def add_log(category: str, event: str, level: str = "info"):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO logs (event, category, level, created_at) VALUES (?,?,?,?)",
        (event, category, level, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def save_log(event: str, category: str = "System", level: str = "info"):
    add_log(category, event, level)

def get_logs(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT id, event, category, level, created_at FROM logs ORDER BY id DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [{"id": r[0], "event": r[1], "category": r[2], "level": r[3], "created_at": r[4]} for r in rows]

def get_logs_today_count():
    conn = sqlite3.connect(DB_PATH)
    today = datetime.now().strftime("%Y-%m-%d")
    count = conn.execute(
        "SELECT COUNT(*) FROM logs WHERE created_at LIKE ?", (f"{today}%",)
    ).fetchone()[0]
    conn.close()
    return count

init_logs_db()