"""System activity log routes."""


from anyio import to_thread
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.database.logs_db import add_log, get_logs

router = APIRouter()


class LogEntry(BaseModel):
    id: int
    event: str
    category: str = "System"
    level: str = "info"
    created_at: str = ""


class LogCreate(BaseModel):
    # Previously these were query parameters, which meant a normal JSON POST
    # was rejected with a 422.
    event: str
    category: str = "System"
    level: str = "info"


class LogListResponse(BaseModel):
    logs: list[LogEntry]


@router.get("/logs/", response_model=LogListResponse)
async def fetch_logs(limit: int = Query(50, ge=1, le=500)):
    """Return the most recent log entries."""
    logs = await to_thread.run_sync(get_logs, limit)
    return LogListResponse(logs=logs)


@router.post("/logs/", response_model=LogEntry, status_code=201)
async def create_log(data: LogCreate):
    """Record a log entry."""
    return await to_thread.run_sync(
        add_log, data.category, data.event, data.level
    )
