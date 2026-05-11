from fastapi import APIRouter
from pydantic import BaseModel

from app.rag.retrieval import retrieve_relevant_chunks

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(request: ChatRequest):

    chunks = retrieve_relevant_chunks(
        request.message
    )

    return {
        "question": request.message,
        "retrieved_chunks": chunks
    }