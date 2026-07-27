"""Workflow CRUD routes.

State lives in SQLite rather than the previous module-level dict, which was
per-process (so it disagreed with itself under multiple workers) and emptied on
every restart.
"""


from functools import partial

from anyio import to_thread
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.database.workflow_db import (
    IN_FLIGHT_STATUSES,
    add_workflow,
    delete_workflow,
    get_steps,
    get_workflow,
    get_workflows,
    update_workflow,
)
from app.workflows.runner import workflow_runner

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
    error: str = ""
    started_at: str = ""
    finished_at: str = ""
    created_at: str = ""


class StepResponse(BaseModel):
    id: int
    workflow_id: int
    position: int
    action: str
    title: str
    params: dict = {}
    status: str = "pending"
    output: str = ""
    error: str = ""
    started_at: str = ""
    finished_at: str = ""


class RunResponse(BaseModel):
    workflow: WorkflowResponse
    message: str


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


@router.post("/{workflow_id}/run", response_model=RunResponse, status_code=202)
async def run_workflow(workflow_id: int, background: BackgroundTasks):
    """Plan and execute a workflow.

    Returns immediately with 202; the run continues in the background. Poll
    `GET /workflows/{id}/steps` to watch it progress.
    """
    workflow = await to_thread.run_sync(get_workflow, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow["status"] in IN_FLIGHT_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"“{workflow['name']}” is already {workflow['status']}.",
        )

    # Reset progress up front so the UI flips to a running state on this
    # response, rather than showing the previous run until the first step lands.
    # to_thread.run_sync takes positional arguments only, hence partial.
    updated = await to_thread.run_sync(
        partial(update_workflow, workflow_id, status="planning", steps_done=0, error="")
    )

    background.add_task(workflow_runner.run, workflow_id)

    return RunResponse(
        workflow=updated,
        message="Workflow started. Poll /steps to follow its progress.",
    )


@router.get("/{workflow_id}/steps", response_model=list[StepResponse])
async def read_steps(workflow_id: int):
    """The planned steps and their live status/output."""
    workflow = await to_thread.run_sync(get_workflow, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return await to_thread.run_sync(get_steps, workflow_id)
