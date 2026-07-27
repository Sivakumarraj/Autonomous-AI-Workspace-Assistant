"""Regression tests for the memory endpoints."""


def test_get_memories_returns_200(client):
    """GET /memory/ used to 500.

    MemoryResponse declared `id: str` and a required `icon`, but the database
    returns an integer id and had no icon column, so pydantic rejected every
    row on the way out.
    """
    response = client.get("/memory/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_then_read_memory(client):
    created = client.post(
        "/memory/",
        json={
            "category": "Technical Note",
            "content": "The vector store is ChromaDB.",
            "source": "manual",
        },
    )

    assert created.status_code == 201
    body = created.json()
    assert isinstance(body["id"], int)
    assert body["icon"] == "🔧"  # derived from the category

    listed = client.get("/memory/").json()
    assert any(item["id"] == body["id"] for item in listed)


def test_duplicate_content_is_not_stored_twice(client):
    payload = {"category": "User Preference", "content": "Dedupe me", "source": "manual"}

    first = client.post("/memory/", json=payload).json()
    second = client.post("/memory/", json=payload).json()

    assert first["id"] == second["id"]


def test_delete_memory_actually_deletes(client):
    """workspace_memory.delete_fact() used to be `pass`, so DELETE was a no-op
    that still reported success."""
    created = client.post(
        "/memory/",
        json={"category": "General Knowledge", "content": "Delete me", "source": "test"},
    ).json()

    assert client.delete(f"/memory/{created['id']}").status_code == 200

    remaining_ids = [item["id"] for item in client.get("/memory/").json()]
    assert created["id"] not in remaining_ids


def test_deleting_a_missing_memory_is_404(client):
    assert client.delete("/memory/999999").status_code == 404


def test_empty_content_is_rejected(client):
    response = client.post(
        "/memory/", json={"category": "x", "content": "   ", "source": "test"}
    )

    assert response.status_code == 400
