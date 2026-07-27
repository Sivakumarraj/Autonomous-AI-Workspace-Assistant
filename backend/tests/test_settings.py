"""GET /settings reports live config and never leaks credentials."""

import json


def test_settings_reports_live_config(client):
    response = client.get("/settings")

    assert response.status_code == 200
    body = response.json()

    # Values the Settings page renders.
    assert body["gemini_model"] == "gemini-2.5-flash"
    assert body["embedding_model"] == "gemini-embedding-001"
    assert body["chunk_size"] == 500
    assert body["chunk_overlap"] == 50
    assert body["allowed_extensions"] == [".pdf", ".txt", ".md"]
    assert body["terminal_tool_enabled"] is False
    assert body["browser_tool_enabled"] is False


def test_settings_reflects_missing_api_key(client):
    """The suite runs with no key, so this must report False rather than crash."""
    assert client.get("/settings").json()["gemini_configured"] is False


def test_settings_never_leaks_secrets(client, monkeypatch):
    """The response must carry presence booleans only, never the values.

    A regression here would publish the deployment's API key to every browser
    that loads the Settings page.
    """
    from app.core.config import settings

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "AIza-super-secret-key", raising=False)
    monkeypatch.setattr(settings, "SECRET_KEY", "jwt-signing-secret", raising=False)

    response = client.get("/settings")
    raw = json.dumps(response.json())

    assert "AIza-super-secret-key" not in raw
    assert "jwt-signing-secret" not in raw

    # And no key-shaped field names either.
    forbidden = {"gemini_api_key", "secret_key", "api_key", "openai_api_key"}
    assert forbidden.isdisjoint(response.json().keys())

    # Presence is still reported correctly.
    assert response.json()["gemini_configured"] is True


def test_settings_is_available_under_api_prefix(client):
    assert client.get("/api/settings").status_code == 200
