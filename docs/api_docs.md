# API Reference

Interactive docs are served by the running app at **`/docs`** (Swagger) and
**`/redoc`**. Those are generated from the code, so they are always current —
this page is a summary.

## Base URL

```
http://localhost:8000            # local
https://<service>.onrender.com   # deployed
```

Every route below is also mounted under an `/api` prefix (`/api/files`,
`/api/memory/`, …). Both forms are identical; `NEXT_PUBLIC_API_URL` may point at
either.

---

## System

### `GET /health`
Liveness/readiness probe. Render uses this as its health check.

```json
{
  "status": "healthy",
  "app": "Nexus AI Workspace",
  "version": "1.0.0",
  "gemini": "configured",
  "checks": { "database": "ok", "vector_store": "ok (12 chunks)" }
}
```

`gemini` is `"missing"` when no API key is set. The app is still healthy in that
state — only the AI routes are affected.

### `GET /`
Returns name, version, and links to `/docs` and `/health`.

---

## Chat

### `POST /chat`

```json
{ "message": "What does my resume say about vector databases?" }
```

```json
{
  "response": "According to your uploaded resume, your favourite vector database is ChromaDB.",
  "retrieved_chunks": ["Siva Kumar is an AI engineer..."],
  "mode": "rag",
  "memory_saved": null
}
```

`mode` is one of:

| Mode | Meaning |
|---|---|
| `general` | Plain Gemini answer, with any relevant stored memories injected |
| `rag` | Document chunks were retrieved and used. `retrieved_chunks` is non-empty |
| `workflow` | A tool workflow handled it; no AI call was made |

`memory_saved` is set when the message was recognised as a durable fact and
stored (e.g. "I prefer FastAPI for backends").

**`503`** — no `GEMINI_API_KEY` configured. The body's `detail` says so.

---

## Files

### `POST /upload`
`multipart/form-data`, field name `file`. Accepts `.pdf`, `.txt`, `.md`.

```json
{
  "id": 1,
  "filename": "resume.pdf",
  "stored_name": "7217ed0d..._resume.pdf",
  "size_bytes": 827,
  "chunks_count": 1,
  "embedding_dimension": 3072,
  "vector_storage": "completed",
  "message": "Upload successful",
  "warning": null
}
```

`warning` is non-null when the file was stored but not indexed — a scanned PDF
with no text layer, or a missing API key. Filenames are stripped of directory
components before use.

| Status | Cause |
|---|---|
| `400` | Unsupported extension, or the file is empty |
| `413` | Exceeds `MAX_UPLOAD_SIZE` |

### `GET /files`
List all uploaded files.

### `DELETE /files/{file_id}`
Removes the database record and the bytes on disk. `404` if unknown.

---

## Memory

### `GET /memory/`
```json
[{ "id": 1, "category": "User Preference", "content": "Prefers FastAPI",
   "source": "chat", "created_at": "2026-07-27T05:58:11+00:00", "icon": "👤" }]
```

### `POST /memory/` → `201`
```json
{ "category": "Technical Note", "content": "Vector store is ChromaDB", "source": "manual" }
```
Identical content is deduplicated — the existing entry is returned instead of a
second row. `icon` is derived from `category`.

### `DELETE /memory/{memory_id}`
`404` if unknown.

---

## Workflows

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/workflows/` | List all |
| `POST` | `/workflows/` | Create — `{ name, description?, total_steps? }` → `201` |
| `GET` | `/workflows/{id}` | Fetch one |
| `PUT` | `/workflows/{id}` | Update `name` / `description` / `status` / `steps_done` |
| `POST` | `/workflows/{id}/pause` | Set status to `paused` |
| `POST` | `/workflows/{id}/resume` | Set status to `active` |
| `DELETE` | `/workflows/{id}` | Delete |

`progress` is derived from `steps_done / steps_total`, not stored.

---

## Logs

### `GET /logs/?limit=50`
`limit` must be between 1 and 500. Returns `{ "logs": [...] }`.

### `POST /logs/` → `201`
```json
{ "event": "Something happened", "category": "System", "level": "info" }
```

---

## Dashboard

### `GET /dashboard/stats`
```json
{ "total_files": 3, "memory_entries": 5, "logs_today": 12,
  "active_workflows": 1, "conversations": 40, "completed_tasks": 2 }
```

`conversations` currently reports total log volume — there is no conversations
table yet.

### `GET /dashboard/activity`
The ten most recent log entries.

---

## Auth

Implemented with signed JWTs (HS256) and bcrypt. **Application routes are not
protected by default** so the demo works without logging in; to enforce auth,
add `Depends(get_current_user)` from `app/api/dependencies.py` to the routers you
want to lock down.

### `POST /auth/register` → `201`
`{ "username": "...", "password": "...", "email": "..." }` — password must be
8–72 bytes. `409` if the username is taken.

### `POST /auth/login`
Returns `{ "access_token": "...", "token_type": "bearer", "expires_in_minutes": 60 }`.
`401` on bad credentials — the message is identical for an unknown user and a
wrong password, so it cannot be used to enumerate accounts.

### `GET /auth/me`
Requires `Authorization: Bearer <token>`. `401` if missing, malformed, expired,
or signed with another key.

The user store is in-process and resets on restart. An `admin` / `admin123`
account is seeded **only** when `DEBUG=true`.

---

## Errors

All errors return JSON:

```json
{ "detail": "Human-readable explanation", "error": "AIUnavailableError" }
```

| Status | When |
|---|---|
| `400` | Invalid input (bad file type, empty content) |
| `401` | Missing or invalid token |
| `404` | Resource not found |
| `409` | Conflict (duplicate username) |
| `413` | Upload too large |
| `422` | Request body failed validation |
| `503` | AI unavailable — usually a missing `GEMINI_API_KEY` |

Unexpected exceptions are logged server-side with a traceback and returned as a
generic `500`; internals are never leaked to the client.
