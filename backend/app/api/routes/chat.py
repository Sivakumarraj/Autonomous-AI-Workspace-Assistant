"""Chat route: memory + RAG + workflow routing on top of Gemini."""


from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.database.logs_db import add_log
from app.memory.workspace_memory import workspace_memory
from app.rag.retrieval import retrieve_relevant_chunks_async
from app.services.gemini_service import generate_response
from app.workflows.workflow_engine import workflow_engine

logger = get_logger(__name__)

router = APIRouter()

SYSTEM_PREAMBLE = "You are Nexus AI Workspace Assistant."

# Terms that suggest the user is asking about their uploaded documents.
DOC_KEYWORDS = (
    "resume", "cv", "document", "file", "uploaded", "pdf", "skills",
    "experience", "education", "project", "what does", "according to",
    "summary", "summarise", "summarize", "who is", "what is my",
)

# Phrases that indicate the user is stating a durable fact about themselves.
MEMORY_PATTERNS = (
    "i prefer", "my stack", "i use ", "i am building", "i'm building",
    "i work with", "my frontend", "my backend", "remember that",
)

QUESTION_STARTERS = (
    "what", "how", "why", "when", "where", "should", "can", "is", "are", "do",
    "does", "who",
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)


class ChatResponse(BaseModel):
    response: str
    retrieved_chunks: list[str] = []
    mode: str
    memory_saved: str | None = None


def needs_rag(message: str) -> bool:
    lowered = message.lower()
    return any(keyword in lowered for keyword in DOC_KEYWORDS)


def should_save_memory(message: str) -> bool:
    lowered = message.lower().strip()

    # A question mentioning a preference is not a statement of one.
    if lowered.startswith(QUESTION_STARTERS) or lowered.endswith("?"):
        return False

    return any(pattern in lowered for pattern in MEMORY_PATTERNS)


def clean_memory_text(text: str) -> str:
    collapsed = " ".join(text.strip().split())
    return collapsed[:1].upper() + collapsed[1:] if collapsed else collapsed


def _build_prompt(
    user_message: str, memory_context: str, document_context: str = ""
) -> str:
    sections = [SYSTEM_PREAMBLE]

    if memory_context:
        sections.append(f"What you remember about the user:\n{memory_context}")

    if document_context:
        sections.append(
            "Context from the user's uploaded documents. Answer from this "
            "where relevant, and say so if it does not contain the answer:\n"
            f"{document_context}"
        )

    sections.append(f"User message:\n{user_message}")
    return "\n\n".join(sections)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle a chat turn.

    Order matters: a recognised workflow short-circuits before any AI call, so
    `show uploaded files` works even with no API key configured.
    """
    user_message = request.message.strip()
    memory_saved: str | None = None

    if should_save_memory(user_message):
        cleaned = clean_memory_text(user_message)
        workspace_memory.add_fact(
            category="User Preference", content=cleaned, source="chat"
        )
        memory_saved = cleaned

    workflow_result = await workflow_engine.execute(user_message)
    if workflow_result["workflow"] != "unknown":
        add_log("workflow", f"Executed workflow for: {user_message[:80]}")
        return ChatResponse(
            response=str(workflow_result["result"]),
            mode="workflow",
            memory_saved=memory_saved,
        )

    memories = workspace_memory.search_memories(user_message)
    memory_context = "\n".join(f"- {item['content']}" for item in memories)

    chunks: list[str] = []
    mode = "general"

    if needs_rag(user_message):
        chunks = await retrieve_relevant_chunks_async(user_message)
        # Only claim RAG mode if retrieval actually returned something —
        # previously an empty vector store still reported mode="rag".
        if chunks:
            mode = "rag"

    prompt = _build_prompt(user_message, memory_context, "\n\n".join(chunks))
    reply = await generate_response(prompt)

    add_log("chat", f"Chat turn handled (mode={mode})")

    return ChatResponse(
        response=reply,
        retrieved_chunks=chunks,
        mode=mode,
        memory_saved=memory_saved,
    )
