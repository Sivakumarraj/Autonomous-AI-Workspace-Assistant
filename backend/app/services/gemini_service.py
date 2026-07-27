"""Gemini text-generation service."""

import re

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


def friendly_error(exc: Exception) -> str:
    """Turn a provider exception into something worth showing a user.

    The SDK raises errors carrying the whole JSON error document, which is
    unreadable in a toast or a workflow's error field.
    """
    raw = str(exc)

    if "RESOURCE_EXHAUSTED" in raw or "429" in raw:
        limit = re.search(r"'quotaValue':\s*'(\d+)'", raw)
        retry = re.search(r"'retryDelay':\s*'([^']+)'", raw)

        message = "Gemini quota exceeded"
        if limit:
            message += f" (free-tier limit: {limit.group(1)} requests/day)"
        if retry:
            message += f". Retry in {retry.group(1)}"
        return f"{message}."

    if "API_KEY_INVALID" in raw or "API key not valid" in raw:
        return "The configured GEMINI_API_KEY was rejected. Check or rotate it."

    if "PERMISSION_DENIED" in raw or "403" in raw:
        return "Gemini denied the request. Check the API key's permissions."

    if "DEADLINE_EXCEEDED" in raw or "504" in raw:
        return "Gemini timed out. Try again."

    # Unrecognised: keep it, but capped so it stays readable.
    collapsed = " ".join(raw.split())
    return collapsed if len(collapsed) <= 200 else f"{collapsed[:200]}…"


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
        raise AIUnavailableError(friendly_error(exc)) from exc
