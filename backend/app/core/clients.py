"""
Lazily-constructed external clients.

Both the Gemini and ChromaDB clients used to be built at module import time.
That meant a missing GEMINI_API_KEY crashed the process on startup, and two
separate Chroma PersistentClients were opened against the same directory. These
cached accessors fix both: nothing is constructed until first use, and there is
exactly one instance of each per process.
"""

from functools import lru_cache
from typing import TYPE_CHECKING

from app.core.config import settings
from app.core.exceptions import AIUnavailableError
from app.core.logging import get_logger

if TYPE_CHECKING:  # pragma: no cover - typing only
    import chromadb
    from google import genai

logger = get_logger(__name__)

DOCUMENTS_COLLECTION = "documents"


@lru_cache(maxsize=1)
def get_gemini_client() -> "genai.Client":
    """Return the shared Gemini client.

    Raises AIUnavailableError when no API key is configured, so callers can
    turn that into a clean 503 rather than an unhandled exception.
    """
    if not settings.gemini_configured:
        raise AIUnavailableError(
            "GEMINI_API_KEY is not configured. Set it in the environment to "
            "enable chat, embeddings, and RAG."
        )

    from google import genai

    logger.info("Initialising Gemini client (model=%s)", settings.GEMINI_MODEL)
    return genai.Client(api_key=settings.GEMINI_API_KEY)


@lru_cache(maxsize=1)
def get_chroma_client() -> "chromadb.ClientAPI":
    """Return the shared persistent ChromaDB client."""
    import chromadb

    settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Opening ChromaDB at %s", settings.CHROMA_DIR)
    return chromadb.PersistentClient(path=str(settings.CHROMA_DIR))


def get_documents_collection():
    """Return the single collection all document chunks are stored in."""
    return get_chroma_client().get_or_create_collection(name=DOCUMENTS_COLLECTION)


def reset_clients() -> None:
    """Drop cached clients. Used by tests that swap the data directory."""
    get_gemini_client.cache_clear()
    get_chroma_client.cache_clear()
