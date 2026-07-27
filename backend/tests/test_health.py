"""The app must boot and stay usable with no GEMINI_API_KEY configured."""


def test_health_reports_healthy_without_an_api_key(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["gemini"] == "missing"
    assert body["checks"]["database"] == "ok"
    assert body["checks"]["vector_store"].startswith("ok")


def test_root_points_at_the_docs(client):
    body = client.get("/").json()

    assert body["docs"] == "/docs"
    assert body["health"] == "/health"


def test_chat_returns_503_not_500_without_a_key(client):
    """A missing key is a configuration problem, not a crash."""
    response = client.post("/chat", json={"message": "hello"})

    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]


def test_every_router_is_mounted(client):
    """workflows and auth were previously never registered in main.py."""
    paths = {route.path for route in client.app.routes}

    for path in ("/chat", "/upload", "/files", "/memory/", "/logs/",
                 "/workflows/", "/auth/login", "/dashboard/stats"):
        assert path in paths, f"{path} is not mounted"


def test_routers_are_also_served_under_api_prefix(client):
    """frontend/src/services/api.ts historically called /api/... paths."""
    assert client.get("/api/dashboard/stats").status_code == 200
    assert client.get("/api/memory/").status_code == 200
