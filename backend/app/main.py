"""
Nexus AI Workspace — FastAPI application entrypoint.
"""

import asyncio
import sys

# Must run before any Playwright/asyncio subprocess use on Windows.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager  # noqa: E402

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

from app.api.routes.auth import _seed_default_user  # noqa: E402
from app.api.routes.auth import router as auth_router  # noqa: E402
from app.api.routes.chat import router as chat_router  # noqa: E402
from app.api.routes.dashboard import router as dashboard_router  # noqa: E402
from app.api.routes.files import router as files_router  # noqa: E402
from app.api.routes.logs import router as logs_router  # noqa: E402
from app.api.routes.memory import router as memory_router  # noqa: E402
from app.api.routes.settings import router as settings_router  # noqa: E402
from app.api.routes.workflows import router as workflows_router  # noqa: E402
from app.core.config import DEFAULT_SECRET_KEY, settings  # noqa: E402
from app.core.exceptions import WorkspaceError  # noqa: E402
from app.core.logging import get_logger, setup_logging  # noqa: E402
from app.database.connection import init_db  # noqa: E402
from app.database.workflow_db import reconcile_interrupted_runs  # noqa: E402

logger = get_logger(__name__)


def _check_production_readiness() -> None:
    """Refuse to start a non-debug server with the shipped default secret."""
    if not settings.DEBUG and settings.SECRET_KEY == DEFAULT_SECRET_KEY:
        raise RuntimeError(
            "SECRET_KEY is still the default value. Set a strong SECRET_KEY "
            "before running with DEBUG=false."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start-up and shut-down work.

    Everything that used to happen at module import — directory creation, DB
    schema, client construction — happens here instead, so importing the app
    (for tests or tooling) has no side effects.
    """
    setup_logging()
    _check_production_readiness()

    settings.ensure_directories()
    init_db()
    _seed_default_user()

    # Runs execute in in-process background tasks, so a deploy or crash
    # mid-run would otherwise leave a workflow stuck showing "running" with
    # nothing driving it.
    interrupted = reconcile_interrupted_runs()
    if interrupted:
        logger.warning("Marked %d interrupted workflow run(s) as failed", interrupted)

    logger.info(
        "%s v%s ready (debug=%s, gemini=%s, terminal_tool=%s, browser_tool=%s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.DEBUG,
        "configured" if settings.gemini_configured else "missing",
        settings.ENABLE_TERMINAL_TOOL,
        settings.ENABLE_BROWSER_TOOL,
    )

    if not settings.gemini_configured:
        logger.warning(
            "GEMINI_API_KEY is not set. The API will serve every non-AI "
            "endpoint normally; chat, embeddings, and RAG will return 503."
        )

    yield

    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous AI workspace: documents, RAG, memory, workflows.",
    lifespan=lifespan,
)

# A wildcard origin cannot be combined with credentials — browsers reject the
# response — so origins are always explicit.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(WorkspaceError)
async def workspace_error_handler(request: Request, exc: WorkspaceError):
    """Turn deliberate application errors into clean JSON.

    A missing GEMINI_API_KEY reaches here and becomes a 503 with an actionable
    message rather than a 500 with a traceback.
    """
    logger.warning("%s on %s: %s", type(exc).__name__, request.url.path, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error": type(exc).__name__},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    """Last resort: log the traceback, never leak it to the client."""
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": "InternalServerError"},
    )


@app.get("/health", tags=["system"])
async def health():
    """Liveness/readiness probe. This is the Render health check target."""
    checks = {"database": "unknown", "vector_store": "unknown"}

    try:
        from app.database.memory_db import get_memories_count

        get_memories_count()
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    try:
        from app.services.vector_service import count_documents

        checks["vector_store"] = f"ok ({count_documents()} chunks)"
    except Exception as exc:
        checks["vector_store"] = f"error: {exc}"

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "gemini": "configured" if settings.gemini_configured else "missing",
        "checks": checks,
    }


@app.get("/", tags=["system"])
async def root():
    """Point callers at the docs rather than returning a bare 404."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


# Routers are mounted twice: bare (used by the pages' direct fetch calls) and
# under /api (used by frontend/src/services/api.ts). Serving both means neither
# convention 404s, and NEXT_PUBLIC_API_URL can point at either.
ROUTERS = (
    (chat_router, "", None),
    (files_router, "", ["files"]),
    (dashboard_router, "", ["dashboard"]),
    (logs_router, "", ["logs"]),
    (settings_router, "", ["settings"]),
    (memory_router, "/memory", ["memory"]),
    (workflows_router, "/workflows", ["workflows"]),
    (auth_router, "/auth", ["auth"]),
)

for router, prefix, tags in ROUTERS:
    app.include_router(router, prefix=prefix, tags=tags)
    app.include_router(
        router,
        prefix=f"/api{prefix}",
        tags=tags,
        include_in_schema=False,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
