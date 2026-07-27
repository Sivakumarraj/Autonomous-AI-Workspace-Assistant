# Nexus AI Workspace

A full-stack AI workspace: upload documents, chat with them via retrieval-augmented
generation, and keep persistent memory across conversations.

**Stack:** FastAPI + Google Gemini + ChromaDB + SQLite · Next.js 16 + TypeScript

---

## What it does

| Feature | State | Notes |
|---|---|---|
| **Document upload** | Working | Drag-and-drop with per-file progress, PDF / TXT / MD, size cap and extension allowlist enforced while streaming |
| **RAG pipeline** | Working | Extract → chunk (with overlap) → embed via `gemini-embedding-001` → ChromaDB → retrieve top-k |
| **Chat** | Working | Gemini 2.5 Flash, switches to RAG automatically, shows retrieval mode and expandable source chunks |
| **Memory** | Working | Auto-extracted from chat, deduplicated, plus manual create/delete and category filtering in the UI |
| **Workflows** | Working | Describe an outcome; Gemini plans the steps and the engine runs them against your documents and memory, with live progress. See [Workflows](#workflows) |
| **Dashboard / Logs** | Working | Live counters, activity feed, level and category filters, optional auto-refresh |
| **Settings** | Working | Read-only view of live server config plus local preferences. Deliberately has no API-key field — a key typed into a browser cannot reach the backend safely |
| **Command palette** | Working | ⌘K / Ctrl+K, fuzzy search across files, memories, workflows, and logs |
| **Themes** | Working | Dark by default, light opt-in, applied before first paint so there is no flash |
| **Auth** | Available, not enforced | Real JWT + bcrypt at `/auth/*`. App routes are public so the demo works without a login — add `Depends(get_current_user)` to lock them down |
| **Browser automation** | Scaffolded | Playwright tool exists behind `ENABLE_BROWSER_TOOL`; off by default |
| **Agents** (`app/agents/`) | Scaffolded | `browser_agent`, `memory_agent`, `rag_agent`, `workflow_agent` return placeholder values. The working RAG and memory paths are in `app/rag/` and `app/memory/` |
| **Chat history** | Not built | Conversations are per-session; there is no persistence endpoint for them yet |

---

## Quick start

**Requirements:** Python 3.11+, Node 20+, and a
[Gemini API key](https://aistudio.google.com/apikey) (the free tier is enough).

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env       # then put your GEMINI_API_KEY in it
uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs · health at http://localhost:8000/health

> The server starts fine **without** an API key. Every non-AI endpoint keeps
> working and chat/embedding calls return a `503` explaining what is missing.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

### Docker

```bash
cd docker
echo "GEMINI_API_KEY=your-key"            >  .env
echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
docker compose up --build
```

---

## Workflows

A workflow is a described outcome, not a script. You give it a name and a
description; pressing **Run** hands that to Gemini, which plans concrete steps.
The engine executes them in order, feeding each step's output into the next, and
the card shows progress live.

Example — *"Read my uploaded documents, extract the key technical facts into
memory, and write a short summary"* produced:

```
1. extract_facts   Extract technologies from resume  -> saved 4 facts to memory
2. write_note      Report on extracted technologies  -> a written summary
```

### Available step actions

The planner may only emit actions from this catalog (`app/workflows/step_catalog.py`):

| Action | What it does |
|---|---|
| `list_documents` | Names every uploaded document |
| `search_documents` | Retrieves the passages matching a query |
| `answer_question` | Answers a question from the documents |
| `summarize_documents` | Summarises document content |
| `extract_facts` | Pulls durable facts out and **saves them to memory** |
| `recall_memory` | Looks up what is already remembered |
| `save_memory` | Stores one specific fact |
| `write_note` | Writes a report from earlier step results |

### Why the catalog is a hard boundary

The planner is an LLM, so **its output is untrusted**. Every proposed action is
checked against the catalog and every parameter is filtered to the keys that
action declares — an invented action name is dropped, never executed. Shell and
browser access are deliberately excluded: wiring them in would let the contents
of an uploaded document decide what runs on your server.

### Behaviour worth knowing

- **No API key?** A deterministic keyword-based plan is used instead, and steps
  needing Gemini report that they were skipped. The workflow still completes.
- **Re-running** re-plans from scratch and replaces the previous steps.
- **A failed step stops the run** and records the real reason on the workflow.
- **A restart mid-run** marks the workflow failed rather than leaving it stuck
  on "running" forever — execution lives in an in-process background task.
- **Free-tier quota is small.** Gemini's free tier allows 20 generate requests
  per *day* per model. One workflow run costs roughly 3–5 of them, so expect
  about 4–6 runs a day before you hit `RESOURCE_EXHAUSTED`. The UI reports this
  as a plain message, not a raw error dump.

---

## Configuration

All backend settings are environment variables (see `backend/.env.example`).

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Enables chat, embeddings, RAG. Without it the app runs degraded |
| `DATA_DIR` | `backend/data` | **Everything stateful** — SQLite, ChromaDB, uploads, logs. Mount a volume here |
| `SECRET_KEY` | dev default | JWT signing key. Startup **fails** with `DEBUG=false` if left at the default |
| `ALLOWED_ORIGINS` | localhost:3000 | CORS allowlist, comma-separated. A wildcard is not usable with credentials |
| `DEBUG` | `false` | Enables reload and seeds the `admin` demo account |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Chat model |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Embedding model (3072 dimensions) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `500` / `50` | RAG chunking |
| `MAX_UPLOAD_SIZE` | 50 MB | Enforced while streaming, before the file is fully read |
| `ENABLE_TERMINAL_TOOL` | `false` | ⚠️ Runs shell commands server-side. **Leave off in production** |
| `ENABLE_BROWSER_TOOL` | `false` | Playwright automation; needs `playwright install chromium` |

Frontend: `NEXT_PUBLIC_API_URL` (the backend origin). Next.js inlines this at
**build** time, so changing it requires a rebuild, not just a restart.

---

## Deployment

Backend to **Render**, frontend to **Vercel** — both have working free tiers.
Step-by-step instructions: [`docs/deployment.md`](docs/deployment.md).

The short version:

1. Render → New → Blueprint → this repo (uses `render.yaml`). Set `GEMINI_API_KEY`
   and `ALLOWED_ORIGINS` in the dashboard.
2. Vercel → import the repo, root directory `frontend`, set
   `NEXT_PUBLIC_API_URL` to the Render URL.
3. Update `ALLOWED_ORIGINS` on Render to the Vercel domain and redeploy.

`render.yaml` mounts a 1 GB disk at `/data`. Without it every deploy would start
with an empty database.

---

## Architecture

```
frontend/                  Next.js 16 App Router
  src/lib/config.ts        Single source of the API base URL
  src/services/            Typed fetch wrappers; surface backend error messages
  src/app/                 Pages — all read live data from the API

backend/app/
  main.py                  App wiring, lifespan, /health, CORS, router mounting
  core/
    config.py              Pydantic settings; all paths derive from DATA_DIR
    clients.py             Lazy, cached Gemini + ChromaDB clients
    security.py            JWT (PyJWT) + bcrypt
    exceptions.py          Typed errors mapped to HTTP status codes
  api/routes/              chat, files, memory, logs, dashboard, workflows, auth
  rag/                     chunking.py, retrieval.py
  services/                gemini, embedding, vector store
  memory/                  workspace_memory.py — durable facts
  database/                connection.py (shared SQLite) + per-table modules
  tools/                   file, terminal (gated), browser (gated)
```

Two design points worth knowing:

- **Nothing is constructed at import time.** Clients, directories, and the
  database schema are all set up in the FastAPI lifespan, so importing the app
  has no side effects and a missing API key cannot crash startup.
- **Blocking calls run in a thread pool.** The Gemini SDK, ChromaDB, and sqlite3
  are all synchronous; each is wrapped in `anyio.to_thread.run_sync` so one slow
  request cannot stall the event loop.

Routers are mounted twice — bare (`/files`) and under `/api` (`/api/files`) — so
either convention works for `NEXT_PUBLIC_API_URL`.

---

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest              # 95 tests
ruff check app tests
```

The suite runs with **no API key configured** on purpose: that proves the app
still boots and serves its whole non-AI surface. It covers path traversal,
command injection, JWT forgery and expiry, upload limits, chunking edges, and
that `GET /settings` never leaks a credential.

### End-to-end UI verification

`scripts/verify_ui.py` drives the real app in Chromium and exercises **every
interactive control**, not just page loads — upload and delete a file, create /
pause / resume / step / delete a workflow, create and delete a memory, toggle
log filters, open the command palette and navigate by keyboard, flip the theme,
send a chat message, and repeat the sweep at 390px checking the mobile drawer
and horizontal overflow. It fails on any console error or any failed request.

```bash
# with both servers running
python scripts/verify_ui.py --frontend http://localhost:3000 \
                            --backend  http://localhost:8000
```

CI (`.github/workflows/ci.yml`) runs backend lint + tests, frontend lint + build,
and builds both Docker images on every push.

---

## Security notes

- `ENABLE_TERMINAL_TOOL` executes shell commands. It is **off by default**; when
  on, input is `shlex`-tokenised, shell metacharacters are rejected, and only an
  exact-match allowlist runs — there is no `shell=True` anywhere.
- Uploaded filenames are stripped of both `/` and `\` path components, so a
  traversal attempt cannot escape the upload directory.
- `SECRET_KEY` must be changed before running with `DEBUG=false`; startup refuses
  otherwise.
- The `admin` / `admin123` demo account is seeded only when `DEBUG=true`.

## License

MIT — see [LICENSE](LICENSE).
