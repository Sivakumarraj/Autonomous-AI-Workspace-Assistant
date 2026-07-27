"""Gemini text-generation service."""

from anyio import to_thread

from app.core.clients import get_gemini_client
from app.core.config import settings
from app.core.exceptions import AIUnavailableError
from app.core.logging import get_logger

logger = get_logger(__name__)


def _generate_sync(prompt: str) -> str:
    client = get_gemini_client()

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )

    return response.text or ""


async def generate_response(prompt: str) -> str:
    """Generate a reply from Gemini.

    The google-genai SDK call is synchronous, so it runs in a worker thread —
    calling it directly from an async handler would block the event loop and
    stall every other in-flight request.
    """
    try:
        return await to_thread.run_sync(_generate_sync, prompt)
    except AIUnavailableError:
        raise
    except Exception as exc:
        logger.exception("Gemini generation failed")
        raise AIUnavailableError(f"Gemini request failed: {exc}") from exc
