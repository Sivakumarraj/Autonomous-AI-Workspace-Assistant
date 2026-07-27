"""Logs, dashboard, workflows, and the RAG chunking helper."""

import pytest

from app.rag.chunking import chunk_text

# --- Logs --------------------------------------------------------------------

def test_logs_accepts_a_json_body(client):
    """POST /logs/ previously took query parameters, so a normal JSON POST 422'd."""
    response = client.post(
        "/logs/", json={"event": "test event", "category": "System", "level": "info"}
    )

    assert response.status_code == 201
    assert response.json()["event"] == "test event"

    listed = client.get("/logs/").json()["logs"]
    assert any(item["event"] == "test event" for item in listed)


def test_logs_limit_is_bounded(client):
    assert client.get("/logs/?limit=1").status_code == 200
    assert client.get("/logs/?limit=0").status_code == 422
    assert client.get("/logs/?limit=100000").status_code == 422


# --- Dashboard ---------------------------------------------------------------

def test_dashboard_stats_are_live_not_hardcoded(client):
    """active_workflows / completed_tasks used to be hardcoded to 0."""
    before = client.get("/dashboard/stats").json()["active_workflows"]

    client.post("/workflows/", json={"name": "Stats probe", "total_steps": 3})

    after = client.get("/dashboard/stats").json()["active_workflows"]
    assert after == before + 1


def test_dashboard_activity_returns_recent_logs(client):
    client.post("/logs/", json={"event": "activity probe", "category": "System"})

    activity = client.get("/dashboard/activity").json()["activity"]

    assert len(activity) <= 10
    assert any(item["event"] == "activity probe" for item in activity)


# --- Workflows ---------------------------------------------------------------

def test_workflow_crud_and_persistence(client):
    created = client.post(
        "/workflows/",
        json={"name": "Doc pipeline", "description": "index docs", "total_steps": 4},
    )
    assert created.status_code == 201
    workflow = created.json()
    assert workflow["status"] == "active"
    assert workflow["progress"] == 0

    workflow_id = workflow["id"]

    paused = client.post(f"/workflows/{workflow_id}/pause").json()
    assert paused["status"] == "paused"

    resumed = client.post(f"/workflows/{workflow_id}/resume").json()
    assert resumed["status"] == "active"

    updated = client.put(f"/workflows/{workflow_id}", json={"steps_done": 2}).json()
    assert updated["steps_done"] == 2
    assert updated["progress"] == 50  # derived, not stored

    assert client.delete(f"/workflows/{workflow_id}").status_code == 200
    assert client.get(f"/workflows/{workflow_id}").status_code == 404


@pytest.mark.parametrize("path", ["/workflows/999999", "/workflows/999999/pause"])
def test_missing_workflow_is_404(client, path):
    method = client.post if path.endswith("pause") else client.get
    assert method(path).status_code == 404


# --- Chunking ----------------------------------------------------------------

def test_chunks_overlap_so_boundary_text_stays_findable():
    text = "".join(f"sentence {i}. " for i in range(200))

    chunks = chunk_text(text, chunk_size=100, overlap=20)

    assert len(chunks) > 1
    # The tail of one chunk must reappear at the head of the next. Chunks are
    # stripped, so compare on stripped text.
    assert chunks[0][-20:].strip() in chunks[1]


def test_chunking_edge_cases():
    assert chunk_text("") == []
    assert chunk_text("   ") == []
    assert chunk_text("short", chunk_size=100) == ["short"]

    with pytest.raises(ValueError):
        chunk_text("text", chunk_size=10, overlap=10)
    with pytest.raises(ValueError):
        chunk_text("text", chunk_size=0)


def test_chunking_terminates_and_covers_the_whole_text():
    text = "abcdefghij" * 50

    chunks = chunk_text(text, chunk_size=50, overlap=10)

    assert len(chunks) < 100  # no runaway loop
    assert chunks[0].startswith("abcdefghij")
    assert text.endswith(chunks[-1][-10:])
