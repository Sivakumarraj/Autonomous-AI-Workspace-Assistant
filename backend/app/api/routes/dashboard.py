"""Dashboard aggregate routes."""


from anyio import to_thread
from fastapi import APIRouter
from pydantic import BaseModel

from app.database.files_db import get_files_count
from app.database.logs_db import get_logs, get_logs_count, get_logs_today_count
from app.database.memory_db import get_memories_count
from app.database.workflow_db import (
    get_active_workflows_count,
    get_completed_workflows_count,
)

router = APIRouter()


class DashboardStats(BaseModel):
    total_files: int
    memory_entries: int
    logs_today: int
    active_workflows: int
    conversations: int
    completed_tasks: int


class ActivityItem(BaseModel):
    id: int
    event: str
    category: str = "System"
    level: str = "info"
    created_at: str = ""


class ActivityResponse(BaseModel):
    activity: list[ActivityItem]


def _collect_stats() -> dict:
    return {
        "total_files": get_files_count(),
        "memory_entries": get_memories_count(),
        "logs_today": get_logs_today_count(),
        # These three were hardcoded to 0 while the queries already existed.
        "active_workflows": get_active_workflows_count(),
        "completed_tasks": get_completed_workflows_count(),
        # There is no conversations table yet; total log volume is the closest
        # honest proxy for workspace activity. See README "Scaffolded".
        "conversations": get_logs_count(),
    }


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_stats():
    """Aggregate counters for the dashboard tiles."""
    return await to_thread.run_sync(_collect_stats)


@router.get("/dashboard/activity", response_model=ActivityResponse)
async def get_activity():
    """The ten most recent activity entries."""
    logs = await to_thread.run_sync(get_logs, 10)
    return ActivityResponse(activity=logs)
