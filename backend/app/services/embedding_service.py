"""Text embedding service backed by Gemini."""


from anyio import to_thread

from app.core.clients import get_gemini_client
from app.core.config import settings
from app.core.exceptions import AIUnavailableError
from app.core.logging import get_logger

logger = get_logger(__name__)


def generate_embedding(text: str) -> list[float]:
    """Embed a single string. Synchronous — call via generate_embedding_async
    from request handlers."""
    client = get_gemini_client()

    try:
        response = client.models.embed_content(
            model=settings.EMBEDDING_MODEL,
            contents=text,
        )
    except Exception as exc:
        logger.exception("Embedding request failed")
        # Same treatment as generation: raw provider errors carry an entire
        # JSON document that is unreadable in the UI.
        from app.services.gemini_service import friendly_error

        raise AIUnavailableError(f"Embedding failed — {friendly_error(exc)}") from exc

    if not response.embeddings:
        raise AIUnavailableError("Embedding response contained no vectors")

    return list(response.embeddings[0].values)


async def generate_embedding_async(text: str) -> list[float]:
    return await to_thread.run_sync(generate_embedding, text)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings, skipping any that fail.

    Returns (vectors, kept_texts) alignment by way of embed_chunks below; this
    helper is kept simple and raises only if the client is unavailable.
    """
    return [generate_embedding(text) for text in texts]


def embed_chunks(chunks: list[str]) -> tuple[list[str], list[list[float]]]:
    """Embed chunks, dropping any that the API rejects.

    Returns the surviving chunks alongside their vectors so the two lists stay
    index-aligned — the previous implementation appended only to `embeddings`
    on success while still storing every chunk, silently pairing text with the
    wrong vector.
    """
    kept_chunks: list[str] = []
    vectors: list[list[float]] = []

    for chunk in chunks:
        if not chunk.strip():
            continue
        try:
            vectors.append(generate_embedding(chunk))
            kept_chunks.append(chunk)
        except AIUnavailableError:
            raise
        except Exception:
            logger.warning("Skipping chunk that failed to embed", exc_info=True)

    return kept_chunks, vectors


async def embed_chunks_async(chunks: list[str]) -> tuple[list[str], list[list[float]]]:
    return await to_thread.run_sync(embed_chunks, chunks)
