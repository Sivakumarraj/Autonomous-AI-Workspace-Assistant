from fastapi import APIRouter
from app.database.files_db import get_files_count
from app.database.memory_db import get_memories_count
from app.database.logs_db import get_logs_today_count, get_logs

router = APIRouter()

@router.get("/dashboard/stats")
def get_stats():
    return {
        "total_files": get_files_count(),
        "memory_entries": get_memories_count(),
        "logs_today": get_logs_today_count(),
        "active_workflows": 0,
        "conversations": 0,
        "completed_tasks": 0
    }

@router.get("/dashboard/activity")
def get_activity():
    return {"activity": get_logs(limit=10)}