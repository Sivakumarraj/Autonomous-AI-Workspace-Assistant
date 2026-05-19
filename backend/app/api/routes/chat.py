from fastapi import APIRouter
from pydantic import BaseModel

from app.services.gemini_service import generate_response
from app.rag.retrieval import retrieve_relevant_chunks
from app.memory.workspace_memory import workspace_memory
from app.tools.file_tool import list_uploaded_files
from app.tools.terminal_tool import run_terminal_command
from app.workflows.workflow_engine import workflow_engine

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


DOC_KEYWORDS = [
    "resume",
    "cv",
    "document",
    "file",
    "uploaded",
    "pdf",
    "skills",
    "experience",
    "education",
    "project",
    "what does",
    "according to",
    "in the",
    "summary",
    "who is",
    "what is my"
]


def needs_rag(message: str) -> bool:

    msg = message.lower()

    return any(
        keyword in msg
        for keyword in DOC_KEYWORDS
    )


def should_save_memory(message: str):

    msg = message.lower().strip()

    memory_patterns = [
        "i prefer",
        "my stack",
        "i use ",
        "i am building",
        "i work with",
        "my frontend",
        "my backend",
    ]

    question_starters = [
        "what",
        "how",
        "why",
        "when",
        "should",
        "can",
        "is",
        "are",
    ]

    # Ignore questions
    if any(
        msg.startswith(q)
        for q in question_starters
    ):
        return False

    return any(
        pattern in msg
        for pattern in memory_patterns
    )


def clean_memory_text(text: str):

    text = text.strip()

    text = " ".join(text.split())

    return text.capitalize()


@router.post("/chat")
async def chat(request: ChatRequest):

    user_message = request.message

    # ==========================================
    # AUTO MEMORY SAVE
    # ==========================================

    if should_save_memory(user_message):

        cleaned_memory = clean_memory_text(
            user_message
        )

        workspace_memory.add_fact(
            category="User Preference",
            content=cleaned_memory,
            source="chat"
        )

    # ==========================================
    # WORKFLOW ENGINE
    # ==========================================

    workflow_result = await workflow_engine.execute(
        user_message
    )

    if workflow_result["workflow"] != "unknown":

        return {
            "response": str(workflow_result["result"]),
            "retrieved_chunks": [],
            "mode": "workflow"
        }

    # ==========================================
    # MEMORY RETRIEVAL
    # ==========================================

    memories = workspace_memory.search_memories(
        user_message
    )

    memory_context = "\n".join(
        [
            f"- {m['content']}"
            for m in memories[-5:]
        ]
    )

    # ==========================================
    # RAG MODE
    # ==========================================

    if needs_rag(user_message):

        chunks = retrieve_relevant_chunks(
            user_message
        )

        document_context = "\n\n".join(chunks)

        prompt = f"""
You are Nexus AI Workspace Assistant.

Use the memory and document context
to answer the user accurately.

User Memory:
{memory_context}

Document Context:
{document_context}

User Question:
{user_message}
"""

        reply = await generate_response(prompt)

        return {
            "response": reply,
            "retrieved_chunks": chunks,
            "mode": "rag"
        }

    # ==========================================
    # GENERAL CHAT MODE
    # ==========================================

    else:

        prompt = f"""
You are Nexus AI Workspace Assistant.

Use the user memory to provide
personalized responses.

User Memory:
{memory_context}

User Message:
{user_message}
"""

        reply = await generate_response(prompt)

        return {
            "response": reply,
            "retrieved_chunks": [],
            "mode": "general"
        }