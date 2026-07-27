"""Text chunking for the RAG pipeline."""


from app.core.config import settings


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    overlap: int | None = None,
) -> list[str]:
    """Split text into overlapping chunks.

    The overlap keeps sentences that straddle a boundary retrievable from both
    sides; without it a fact split across the cut is findable from neither.
    """
    # `or` would treat an explicit 0 as "unset" and silently fall back to the
    # default instead of rejecting it.
    chunk_size = settings.CHUNK_SIZE if chunk_size is None else chunk_size
    overlap = settings.CHUNK_OVERLAP if overlap is None else overlap

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if not 0 <= overlap < chunk_size:
        raise ValueError("overlap must be >= 0 and smaller than chunk_size")

    text = text.strip()
    if not text:
        return []

    chunks: list[str] = []
    step = chunk_size - overlap
    start = 0

    while start < len(text):
        chunk = text[start : start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += step

    return chunks
