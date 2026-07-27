"""Retrieval side of the RAG pipeline."""


from anyio import to_thread

from app.core.clients import get_documents_collection
from app.core.config import settings
from app.core.exceptions import AIUnavailableError
from app.core.logging import get_logger
from app.services.embedding_service import generate_embedding

logger = get_logger(__name__)


def retrieve_relevant_chunks(query: str, top_k: int | None = None) -> list[str]:
    """Return the top-k document chunks most similar to the query.

    Returns an empty list when nothing has been indexed yet, rather than
    raising — the chat route falls back to a general answer in that case.
    """
    top_k = top_k or settings.RETRIEVAL_TOP_K
    collection = get_documents_collection()

    if collection.count() == 0:
        logger.info("Vector store is empty, skipping retrieval")
        return []

    try:
        query_embedding = generate_embedding(query)
    except AIUnavailableError:
        raise
    except Exception:
        logger.exception("Failed to embed the query")
        return []

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )

    documents = results.get("documents") or []
    return documents[0] if documents else []


async def retrieve_relevant_chunks_async(
    query: str, top_k: int | None = None
) -> list[str]:
    return await to_thread.run_sync(retrieve_relevant_chunks, query, top_k)
