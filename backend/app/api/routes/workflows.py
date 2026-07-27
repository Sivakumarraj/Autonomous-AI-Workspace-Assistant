"""Workflow CRUD routes.

State lives in SQLite rather than the previous module-level dict, which was
per-process (so it disagreed with itself under multiple workers) and emptied on
every restart.
"""


from anyio import to_thread
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database.workflow_db import (
    add_workflow,
    delete_workflow,
    get_workflow,
    get_workflows,
    update_workflow,
)

router = APIRouter()


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str = ""
    total_steps: int = Field(default=5, ge=0)


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    steps_done: int | None = Field(default=None, ge=0)


class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: str = ""
    status: str = "active"
    progress: int = 0
    steps_total: int = 0
    steps_done: int = 0
    created_at: str = ""


@router.get("/", response_model=list[WorkflowResponse])
async def list_workflows():
    """List all workflows."""
    return await to_thread.run_sync(get_workflows)


@router.post("/", response_model=WorkflowResponse, status_code=201)
async def create_workflow(data: WorkflowCreate):
    """Create a new workflow."""
    return await to_thread.run_sync(
        add_workflow, data.name, data.total_steps, data.description
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def read_workflow(workflow_id: int):
    workflow = await to_thread.run_sync(get_workflow, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


async def _update(workflow_id: int, **fields) -> dict:
    workflow = await to_thread.run_sync(
        lambda: update_workflow(workflow_id, **fields)
    )
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def modify_workflow(workflow_id: int, data: WorkflowUpdate):
    """Update a workflow's mutable fields."""
    fields = data.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    return await _update(workflow_id, **fields)


@router.post("/{workflow_id}/pause", response_model=WorkflowResponse)
async def pause_workflow(workflow_id: int):
    """Pause a workflow."""
    return await _update(workflow_id, status="paused")


@router.post("/{workflow_id}/resume", response_model=WorkflowResponse)
async def resume_workflow(workflow_id: int):
    """Resume a paused workflow."""
    return await _update(workflow_id, status="active")


@router.delete("/{workflow_id}")
async def remove_workflow(workflow_id: int):
    """Delete a workflow."""
    deleted = await to_thread.run_sync(delete_workflow, workflow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"message": "Workflow deleted", "id": workflow_id}
