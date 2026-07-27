"""Shared test fixtures.

The environment below is set at import time, not inside a fixture. conftest is
imported before test modules are collected, and several of them import
app.core.* at module level — which builds the cached `settings` singleton. A
fixture would run too late and the suite would pick up the developer's real
backend/.env (and their real API key).
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

_DATA_DIR = tempfile.mkdtemp(prefix="nexus-test-")

# No API key on purpose: the suite doubles as proof that the app boots and
# serves its whole non-AI surface with nothing configured.
os.environ.update(
    {
        # Point at a path that does not exist so backend/.env is never loaded.
        "ENV_FILE": os.path.join(_DATA_DIR, "no-such.env"),
        "DATA_DIR": _DATA_DIR,
        "GEMINI_API_KEY": "",
        "DEBUG": "true",
        "SECRET_KEY": "test-secret-key-not-for-production",
        "ENABLE_TERMINAL_TOOL": "false",
        "ENABLE_BROWSER_TOOL": "false",
        "ALLOWED_ORIGINS": "http://localhost:3000",
    }
)


@pytest.fixture(scope="session")
def data_dir() -> Path:
    return Path(_DATA_DIR)


@pytest.fixture(scope="session")
def client():
    """A TestClient with the application's lifespan actually run."""
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
