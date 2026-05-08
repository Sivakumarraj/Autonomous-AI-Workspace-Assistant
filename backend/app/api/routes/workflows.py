"""
Workflows API routes
"""

from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class WorkflowCreate(BaseModel):
    name: str
    description: str
    total_steps: int = 5


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    progress: int
    total_steps: int
    completed_steps: int
    started_at: str


workflows_db: dict = {}


@router.get("/", response_model=List[WorkflowResponse])
async def get_workflows():
    """Get all workflows"""
    return list(workflows_db.values())


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(data: WorkflowCreate):
    """Create a new workflow"""
    wf_id = str(len(workflows_db) + 1)
    workflow = WorkflowResponse(
        id=wf_id,
        name=data.name,
        description=data.description,
        status="active",
        progress=0,
        total_steps=data.total_steps,
        completed_steps=0,
        started_at=datetime.now().strftime("%m/%d/%Y"),
    )
    workflows_db[wf_id] = workflow
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: str, data: WorkflowCreate):
    """Update a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf = workflows_db[workflow_id]
    wf.name = data.name
    wf.description = data.description
    return wf


@router.post("/{workflow_id}/pause", response_model=WorkflowResponse)
async def pause_workflow(workflow_id: str):
    """Pause a workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflows_db[workflow_id].status = "paused"
    return workflows_db[workflow_id]


@router.post("/{workflow_id}/resume", response_model=WorkflowResponse)
async def resume_workflow(workflow_id: str):
    """Resume a paused workflow"""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflows_db[workflow_id].status = "active"
    return workflows_db[workflow_id]
