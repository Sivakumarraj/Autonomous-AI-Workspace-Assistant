"""ChromaDB vector storage."""

import uuid

from anyio import to_thread

from app.core.clients import get_documents_collection
from app.core.logging import get_logger

logger = get_logger(__name__)


def store_embeddings(
    chunks: list[str],
    embeddings: list[list[float]],
    metadata: dict | None = None,
) -> int:
    """Store chunk/vector pairs in one batched write.

    The chunk and embedding lists must be the same length; a mismatch means
    text would be filed under another chunk's vector, so it is rejected rather
    than silently truncated by zip().
    """
    if len(chunks) != len(embeddings):
        raise ValueError(
            f"chunks ({len(chunks)}) and embeddings ({len(embeddings)}) "
            "must be the same length"
        )

    if not chunks:
        return 0

    collection = get_documents_collection()

    collection.add(
        documents=list(chunks),
        embeddings=list(embeddings),
        ids=[str(uuid.uuid4()) for _ in chunks],
        metadatas=[dict(metadata or {}) for _ in chunks],
    )

    logger.info("Stored %d chunks in the vector store", len(chunks))
    return len(chunks)


async def store_embeddings_async(
    chunks: list[str],
    embeddings: list[list[float]],
    metadata: dict | None = None,
) -> int:
    return await to_thread.run_sync(store_embeddings, chunks, embeddings, metadata)


def count_documents() -> int:
    return get_documents_collection().count()
