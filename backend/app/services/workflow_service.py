"""Workflow Service - Workflow business logic"""

from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


class WorkflowService:
    def __init__(self):
        self.workflows: dict[str, dict[str, Any]] = {}

    async def create(self, name: str, description: str, steps: int) -> dict[str, Any]:
        wf_id = str(len(self.workflows) + 1)
        workflow = {
            "id": wf_id, "name": name, "description": description,
            "status": "active", "total_steps": steps, "completed_steps": 0
        }
        self.workflows[wf_id] = workflow
        return workflow

    async def get_all(self) -> list[dict[str, Any]]:
        return list(self.workflows.values())

    async def update_status(self, wf_id: str, status: str) -> dict[str, Any]:
        if wf_id in self.workflows:
            self.workflows[wf_id]["status"] = status
        return self.workflows.get(wf_id, {})


workflow_service = WorkflowService()
