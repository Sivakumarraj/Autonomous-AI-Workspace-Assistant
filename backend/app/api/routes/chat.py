# backend/app/api/routes/chat.py
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import generate_response
from app.rag.retrieval import retrieve_relevant_chunks
from app.memory.workspace_memory import workspace_memory

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

DOC_KEYWORDS = [
    "resume", "cv", "document", "file", "uploaded", "pdf",
    "skills", "experience", "education", "project", "what does",
    "according to", "in the", "summary", "who is", "what is my"
]

MEMORY_KEYWORDS = [
    "i prefer",
    "my stack",
    "i use",
    "my project",
    "i am building",
    "i work with",
]

def needs_rag(message: str) -> bool:
    msg = message.lower()
    return any(keyword in msg for keyword in DOC_KEYWORDS)

def should_save_memory(message: str):

    msg = message.lower()

    return any(
        keyword in msg
        for keyword in MEMORY_KEYWORDS
    )

@router.post("/chat")
async def chat(request: ChatRequest):

    if should_save_memory(request.message):

        workspace_memory.add_fact(
            category="User Preference",
            content=request.message,
            source="chat"
        )

    memories = workspace_memory.search_memories(request.message)

    memory_context = "\n".join(
        [
            f"- {m['content']}"
            for m in memories[-5:]
        ]
    )

    if needs_rag(request.message):

        chunks = retrieve_relevant_chunks(request.message)

        context = "\n\n".join(chunks)

        prompt = f"""
User Memory:
{memory_context}

Document Context:
{context}

User Question:
{request.message}
"""

        reply = await generate_response(prompt)

        return {
            "response": reply,
            "retrieved_chunks": chunks,
            "mode": "rag"
        }

    else:

        prompt = f"""
User Memory:
{memory_context}

User Message:
{request.message}
"""

        reply = await generate_response(prompt)

        return {
            "response": reply,
            "retrieved_chunks": [],
            "mode": "general"
        }