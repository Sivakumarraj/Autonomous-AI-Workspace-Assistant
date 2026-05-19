import sqlite3, os
from datetime import datetime

DB_PATH = "database/nexus.db"
os.makedirs("database", exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            content TEXT NOT NULL,
            source TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_memory(category: str, content: str, source: str = "chat"):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO memories (category, content, source, created_at) VALUES (?,?,?,?)",
        (category, content, source, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def add_memory(category: str, content: str, source: str = "chat", created_at: str = None, icon: str = "📝"):
    if created_at is None:
        created_at = datetime.now().isoformat()
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO memories (category, content, source, created_at) VALUES (?,?,?,?)",
        (category, content, source, created_at)
    )
    conn.commit()
    conn.close()

def get_memories():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT id, category, content, source, created_at FROM memories ORDER BY id DESC").fetchall()
    conn.close()
    return [{"id": r[0], "category": r[1], "content": r[2], "source": r[3], "created_at": r[4]} for r in rows]

def get_memories_count():
    conn = sqlite3.connect(DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    conn.close()
    return count

init_db()