from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import generate_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(request: ChatRequest):
    reply = await generate_response(request.message)

    return {
        "response": reply
    }