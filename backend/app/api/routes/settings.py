"""
Read-only server configuration.

This exists so the Settings page can show what the server is actually running
instead of the fabricated OpenAI/Anthropic fields it used to display.

It is deliberately read-only: these values come from environment variables and
are owned by whoever deploys the service, not by a browser session.

SECURITY: this must never expose GEMINI_API_KEY, SECRET_KEY, or any other
credential — only the boolean `gemini_configured`. There is a test asserting
exactly that in tests/test_settings.py.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class SettingsResponse(BaseModel):
    app_name: str
    version: str
    debug: bool

    # AI — presence only, never the key itself.
    gemini_configured: bool
    gemini_model: str
    embedding_model: str
    llm_temperature: float

    # RAG
    chunk_size: int
    chunk_overlap: int
    retrieval_top_k: int

    # Uploads
    max_upload_size: int
    allowed_extensions: list[str]

    # Feature flags
    terminal_tool_enabled: bool
    browser_tool_enabled: bool

    # CORS — useful when debugging a blocked frontend.
    allowed_origins: list[str]


@router.get("/settings", response_model=SettingsResponse)
async def get_settings() -> SettingsResponse:
    """Report the live server configuration."""
    return SettingsResponse(
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        gemini_configured=settings.gemini_configured,
        gemini_model=settings.GEMINI_MODEL,
        embedding_model=settings.EMBEDDING_MODEL,
        llm_temperature=settings.LLM_TEMPERATURE,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        retrieval_top_k=settings.RETRIEVAL_TOP_K,
        max_upload_size=settings.MAX_UPLOAD_SIZE,
        allowed_extensions=settings.ALLOWED_EXTENSIONS,
        terminal_tool_enabled=settings.ENABLE_TERMINAL_TOOL,
        browser_tool_enabled=settings.ENABLE_BROWSER_TOOL,
        allowed_origins=settings.ALLOWED_ORIGINS,
    )
