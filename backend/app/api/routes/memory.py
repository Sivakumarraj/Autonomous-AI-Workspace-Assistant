from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.memory.workspace_memory import workspace_memory

router = APIRouter()


class MemoryCreate(BaseModel):
    category: str
    content: str
    source: str


class MemoryResponse(BaseModel):
    id: str
    category: str
    content: str
    source: str
    created_at: str
    icon: str


@router.get("/", response_model=List[MemoryResponse])
async def get_memories():

    return workspace_memory.get_facts()


@router.post("/", response_model=MemoryResponse)
async def create_memory(data: MemoryCreate):

    memory = workspace_memory.add_fact(
        category=data.category,
        content=data.content,
        source=data.source,
    )

    return memory


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):

    workspace_memory.delete_fact(memory_id)

    return {
        "message": "Memory deleted successfully"
    }