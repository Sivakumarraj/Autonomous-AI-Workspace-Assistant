"""Workspace memory routes."""


from anyio import to_thread
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.memory.workspace_memory import workspace_memory

router = APIRouter()


class MemoryCreate(BaseModel):
    category: str
    content: str
    source: str = "manual"


class MemoryResponse(BaseModel):
    # `id` is an autoincrement INTEGER in SQLite. Declaring it as `str` here is
    # what made GET /memory/ fail validation with a 500 on every request.
    id: int
    category: str = ""
    content: str
    source: str = ""
    created_at: str = ""
    icon: str = ""


@router.get("/", response_model=list[MemoryResponse])
async def get_memories():
    """List every stored memory, newest first."""
    return await to_thread.run_sync(workspace_memory.get_facts)


@router.post("/", response_model=MemoryResponse, status_code=201)
async def create_memory(data: MemoryCreate):
    """Store a new memory."""
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Memory content is required")

    return await to_thread.run_sync(
        workspace_memory.add_fact, data.category, data.content, data.source
    )


@router.delete("/{memory_id}")
async def delete_memory(memory_id: int):
    """Delete a memory by id."""
    deleted = await to_thread.run_sync(workspace_memory.delete_fact, memory_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")

    return {"message": "Memory deleted successfully", "id": memory_id}
