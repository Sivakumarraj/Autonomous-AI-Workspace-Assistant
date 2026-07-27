"""
Application configuration.

All settings are read from environment variables (or a `.env` file next to the
backend package). Every filesystem path is derived from DATA_DIR so nothing
depends on the process working directory — this is what makes the app behave
the same locally, in Docker, and on Render.
"""

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_SECRET_KEY = "nexus-ai-secret-key-change-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Overridable so the test suite can point at a file that does not
        # exist and never picks up a developer's real credentials.
        env_file=os.getenv("ENV_FILE", str(BACKEND_ROOT / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Server ---
    APP_NAME: str = "Nexus AI Workspace"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- CORS ---
    # Comma-separated in the environment, e.g.
    #   ALLOWED_ORIGINS=https://app.vercel.app,http://localhost:3000
    # NoDecode stops pydantic-settings JSON-parsing the raw value, which would
    # otherwise blow up on a plain comma-separated string before the validator
    # below ever runs.
    ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
        ]
    )

    # --- Storage ---
    # On Render this is the mounted disk (/data). Locally it defaults to
    # backend/data, which is gitignored.
    DATA_DIR: Path = BACKEND_ROOT / "data"

    # --- AI ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    LLM_TEMPERATURE: float = 0.7

    # --- RAG ---
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    RETRIEVAL_TOP_K: int = 3

    # --- Uploads ---
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [".pdf", ".txt", ".md"]
    )

    # --- Security ---
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- Feature flags ---
    # The terminal tool executes shell commands on the server. It is off by
    # default and must never be enabled on a publicly reachable deployment.
    ENABLE_TERMINAL_TOOL: bool = False
    # Browser automation needs `playwright install chromium`, which is not part
    # of the default image.
    ENABLE_BROWSER_TOOL: bool = False

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    @field_validator("ALLOWED_ORIGINS", "ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def _split_csv(cls, value):
        """Accept a JSON array or a plain comma-separated string.

        NoDecode means pydantic-settings hands the raw string straight through,
        so JSON has to be parsed here rather than upstream.
        """
        if not isinstance(value, str):
            return value

        stripped = value.strip()

        if stripped.startswith("["):
            try:
                return json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Expected a JSON array or CSV string: {exc}") from exc

        return [item.strip() for item in stripped.split(",") if item.strip()]

    @field_validator("LOG_LEVEL")
    @classmethod
    def _upper(cls, value: str) -> str:
        return value.upper()

    # --- Derived paths ---

    @property
    def UPLOAD_DIR(self) -> Path:
        return self.DATA_DIR / "uploads"

    @property
    def CHROMA_DIR(self) -> Path:
        return self.DATA_DIR / "vector_store"

    @property
    def SQLITE_PATH(self) -> Path:
        return self.DATA_DIR / "nexus.db"

    @property
    def LOG_DIR(self) -> Path:
        return self.DATA_DIR / "logs"

    @property
    def gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY.strip())

    def ensure_directories(self) -> None:
        """Create every directory the app writes to. Called once on startup."""
        for path in (self.UPLOAD_DIR, self.CHROMA_DIR, self.LOG_DIR):
            path.mkdir(parents=True, exist_ok=True)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
