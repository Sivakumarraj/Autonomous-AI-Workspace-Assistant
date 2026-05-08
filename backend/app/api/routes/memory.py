"""
Memory API routes
"""

from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime

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


CATEGORY_ICONS = {
    "User Preference": "👤",
    "Project Context": "📁",
    "Technical Note": "🔧",
    "Workflow Pattern": "⚙️",
    "Code Pattern": "💻",
    "General Knowledge": "📚",
}

memory_db: dict = {}


@router.get("/", response_model=List[MemoryResponse])
async def get_memories():
    """Get all memory entries"""
    return list(memory_db.values())


@router.post("/", response_model=MemoryResponse)
async def create_memory(data: MemoryCreate):
    """Create a new memory entry"""
    mem_id = str(len(memory_db) + 1)
    memory = MemoryResponse(
        id=mem_id,
        category=data.category,
        content=data.content,
        source=data.source,
        created_at=datetime.now().strftime("%m/%d/%Y"),
        icon=CATEGORY_ICONS.get(data.category, "📝"),
    )
    memory_db[mem_id] = memory
    return memory


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory entry"""
    if memory_id not in memory_db:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    del memory_db[memory_id]
    return {"message": "Memory entry deleted"}
