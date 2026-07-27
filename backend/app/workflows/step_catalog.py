"""
The set of actions a workflow step is allowed to perform.

This is the security boundary for workflow execution: the planner is an LLM,
so its output is untrusted. Only actions registered here can ever run, and
every one of them is backed by code that already exists elsewhere in the app
(RAG retrieval, Gemini generation, the memory store).

Deliberately excluded: shell commands and browser automation. Both execute
untrusted input and are gated behind their own feature flags; wiring them into
LLM-planned steps would let a document's contents choose what runs on the
server.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from anyio import to_thread

from app.core.config import settings
from app.core.logging import get_logger
from app.database.files_db import get_files
from app.memory.workspace_memory import workspace_memory
from app.rag.retrieval import retrieve_relevant_chunks_async
from app.services.gemini_service import generate_response

logger = get_logger(__name__)

# How much prior-step context to feed into a later step's prompt.
MAX_CONTEXT_CHARS = 6000
MAX_OUTPUT_CHARS = 8000


@dataclass(frozen=True)
class StepSpec:
    """Describes one action, including what the planner is told about it."""

    action: str
    description: str
    params: dict[str, str]
    run: Callable[..., Awaitable[str]]


def _truncate(text: str, limit: int = MAX_OUTPUT_CHARS) -> str:
    return text if len(text) <= limit else f"{text[:limit]}\n…(truncated)"


# --- Individual actions -------------------------------------------------------


async def list_documents(context: str = "", **_: Any) -> str:
    """Name every uploaded document."""
    files = await to_thread.run_sync(get_files)

    if not files:
        return "No documents have been uploaded yet."

    lines = [
        f"- {f['filename']} ({f['chunk_count']} chunks, status: {f['status']})"
        for f in files
    ]
    return f"{len(files)} document(s):\n" + "\n".join(lines)


async def search_documents(query: str = "", context: str = "", **_: Any) -> str:
    """Retrieve the document chunks most relevant to a query."""
    if not query.strip():
        return "No query supplied, nothing to search for."

    chunks = await retrieve_relevant_chunks_async(query)

    if not chunks:
        return f"No document content matched “{query}”."

    return _truncate(
        f"{len(chunks)} relevant passage(s) for “{query}”:\n\n"
        + "\n\n---\n\n".join(chunks)
    )


async def answer_question(question: str = "", context: str = "", **_: Any) -> str:
    """Answer a question from the documents, falling back to general knowledge."""
    if not question.strip():
        return "No question supplied."

    chunks = await retrieve_relevant_chunks_async(question)
    sources = "\n\n".join(chunks) if chunks else "(no matching documents)"

    prompt = f"""Answer the question using the supplied document context.
If the context does not contain the answer, say so plainly instead of guessing.

Document context:
{sources}

{f"Earlier workflow findings:{chr(10)}{context}" if context else ""}

Question: {question}"""

    return _truncate(await generate_response(prompt))


async def summarize_documents(
    query: str = "", focus: str = "", context: str = "", **_: Any
) -> str:
    """Summarise the documents, optionally narrowed by a query and a focus."""
    chunks = await retrieve_relevant_chunks_async(query or focus or "summary overview")

    if not chunks:
        return "There is no indexed document content to summarise."

    prompt = f"""Summarise the following document content{f" focusing on {focus}" if focus else ""}.
Be concise and concrete. Use bullet points.

{chr(10).join(chunks)}"""

    return _truncate(await generate_response(prompt))


async def extract_facts(
    query: str = "",
    category: str = "General Knowledge",
    context: str = "",
    **_: Any,
) -> str:
    """Pull durable facts out of the documents and store them in memory."""
    chunks = await retrieve_relevant_chunks_async(query or "key facts")

    source = "\n\n".join(chunks) if chunks else context
    if not source.strip():
        return "Nothing available to extract facts from."

    prompt = f"""Extract up to 5 durable, self-contained facts from the text below.
Return one fact per line, with no numbering, bullets, or commentary.
Each fact must stand on its own without the surrounding text.

{source}"""

    raw = await generate_response(prompt)

    facts = [
        line.strip().lstrip("-*•0123456789. ").strip()
        for line in raw.splitlines()
        if len(line.strip()) > 10
    ][:5]

    if not facts:
        return "No facts could be extracted."

    stored: list[str] = []
    for fact in facts:
        # add_fact deduplicates against existing content, so re-running a
        # workflow does not fill memory with copies.
        await to_thread.run_sync(
            workspace_memory.add_fact, category, fact, "workflow"
        )
        stored.append(fact)

    return f"Saved {len(stored)} fact(s) to memory:\n" + "\n".join(
        f"- {fact}" for fact in stored
    )


async def recall_memory(query: str = "", context: str = "", **_: Any) -> str:
    """Look up what the assistant already remembers."""
    memories = await to_thread.run_sync(workspace_memory.search_memories, query or "")

    if not memories:
        return f"Nothing in memory matched “{query}”."

    return "\n".join(f"- [{m['category']}] {m['content']}" for m in memories)


async def save_memory(
    content: str = "",
    category: str = "General Knowledge",
    context: str = "",
    **_: Any,
) -> str:
    """Store a specific fact in memory."""
    if not content.strip():
        return "No content supplied, nothing saved."

    await to_thread.run_sync(
        workspace_memory.add_fact, category, content.strip(), "workflow"
    )
    return f"Saved to memory under {category}: {content.strip()}"


async def write_note(instruction: str = "", context: str = "", **_: Any) -> str:
    """Produce written output from the results of earlier steps."""
    if not instruction.strip():
        return "No instruction supplied."

    prompt = f"""{instruction}

Base your answer on these findings from earlier workflow steps:
{context or "(no earlier findings)"}"""

    return _truncate(await generate_response(prompt))


# --- Registry -----------------------------------------------------------------

CATALOG: dict[str, StepSpec] = {
    spec.action: spec
    for spec in (
        StepSpec(
            action="list_documents",
            description="List every uploaded document with its name and chunk count.",
            params={},
            run=list_documents,
        ),
        StepSpec(
            action="search_documents",
            description="Retrieve the document passages most relevant to a query.",
            params={"query": "what to search the documents for"},
            run=search_documents,
        ),
        StepSpec(
            action="answer_question",
            description="Answer a specific question using the uploaded documents.",
            params={"question": "the question to answer"},
            run=answer_question,
        ),
        StepSpec(
            action="summarize_documents",
            description="Summarise document content, optionally narrowed to a topic.",
            params={
                "query": "optional topic to narrow the summary to",
                "focus": "optional aspect to emphasise",
            },
            run=summarize_documents,
        ),
        StepSpec(
            action="extract_facts",
            description=(
                "Extract durable facts from the documents and save them to memory."
            ),
            params={
                "query": "what kind of facts to look for",
                "category": (
                    "one of: User Preference, Project Context, Technical Note, "
                    "Workflow Pattern, Code Pattern, General Knowledge"
                ),
            },
            run=extract_facts,
        ),
        StepSpec(
            action="recall_memory",
            description="Look up facts the assistant has already stored.",
            params={"query": "what to recall"},
            run=recall_memory,
        ),
        StepSpec(
            action="save_memory",
            description="Save one specific fact to long-term memory.",
            params={
                "content": "the fact to store",
                "category": "the memory category",
            },
            run=save_memory,
        ),
        StepSpec(
            action="write_note",
            description=(
                "Write a report, summary, or answer using earlier step results. "
                "Use this as a final step to pull findings together."
            ),
            params={"instruction": "what to write"},
            run=write_note,
        ),
    )
}


def catalog_prompt() -> str:
    """Render the catalog as the tool list handed to the planner."""
    lines = []
    for spec in CATALOG.values():
        params = (
            ", ".join(f'"{k}": <{v}>' for k, v in spec.params.items())
            if spec.params
            else "no parameters"
        )
        lines.append(f'- "{spec.action}": {spec.description} Params: {params}')
    return "\n".join(lines)


def is_ai_action(action: str) -> bool:
    """True when the action needs Gemini and so cannot run without a key."""
    return action in {
        "answer_question",
        "summarize_documents",
        "extract_facts",
        "write_note",
    }


async def run_step(action: str, params: dict[str, Any], context: str) -> str:
    """Execute one catalog action.

    Raises KeyError for an unknown action — the runner treats that as a failed
    step rather than letting an unvalidated name through.
    """
    spec = CATALOG[action]

    if is_ai_action(action) and not settings.gemini_configured:
        return (
            f"Skipped: “{action}” needs Gemini, but GEMINI_API_KEY is not "
            "configured on the server."
        )

    safe_params = {k: v for k, v in params.items() if k in spec.params}
    logger.info("Running workflow step %s with %s", action, list(safe_params))

    return await spec.run(context=context[:MAX_CONTEXT_CHARS], **safe_params)
