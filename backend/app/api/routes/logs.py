from fastapi import APIRouter
from app.database.logs_db import get_logs, save_log

router = APIRouter()

@router.get("/logs/")
def fetch_logs():
    return {"logs": get_logs()}

@router.post("/logs/")
def create_log(event: str, category: str = "System", level: str = "info"):
    save_log(event, category, level)
    return {"status": "logged"}