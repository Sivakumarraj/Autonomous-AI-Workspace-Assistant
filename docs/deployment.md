# Deployment Guide

Backend → **Render** (Docker + a persistent disk). Frontend → **Vercel**.
Both work on free tiers.

---

## 1. Backend on Render

1. Push this repository to GitHub.
2. Render dashboard → **New** → **Blueprint** → select the repo. Render reads
   [`render.yaml`](../render.yaml) and creates the `nexus-ai-backend` service
   with a 1 GB disk mounted at `/data`.
3. Open the service → **Environment** and set:

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | your key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
   | `ALLOWED_ORIGINS` | your Vercel URL, e.g. `https://nexus-ai.vercel.app` (no trailing slash) |

   `SECRET_KEY` is generated automatically by the blueprint.
4. Deploy, then confirm:

   ```bash
   curl https://<your-service>.onrender.com/health
   ```

   Expect `"status": "healthy"` and `"gemini": "configured"`. If it says
   `"missing"`, the key did not save.

### Why the disk matters

SQLite and ChromaDB both live under `DATA_DIR=/data`. Render containers have an
ephemeral filesystem, so without the mounted disk every deploy and every restart
would silently reset all uploads, memories, and embeddings.

**Consequence:** the service must stay at one instance — Render will not attach a
disk to multiple instances. Moving to Postgres plus a hosted vector store is the
prerequisite for scaling out.

### Free-tier cold starts

Free Render services sleep after ~15 minutes idle and take 30–60 s to wake. The
first request after a sleep will look like a hang. Upgrade the plan if that
matters.

---

## 2. Frontend on Vercel

1. Vercel → **Add New** → **Project** → import the repo.
2. Set **Root Directory** to `frontend`. Framework auto-detects as Next.js.
3. Add an environment variable:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-service>.onrender.com` |

4. Deploy.

> `NEXT_PUBLIC_*` is inlined into the JavaScript bundle at **build** time.
> Changing it later requires a **redeploy** — restarting is not enough.

---

## 3. Connect the two

Go back to Render and set `ALLOWED_ORIGINS` to the exact Vercel origin
(scheme + host, no path, no trailing slash), then redeploy the backend.

Verify from a browser console on the deployed frontend:

```js
fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).then(r => r.json()).then(console.log)
```

A CORS error here means `ALLOWED_ORIGINS` does not exactly match the origin the
browser is sending. `*` is not an option: the API sends credentialed requests and
browsers reject a wildcard for those.

---

## Docker / self-hosted

```bash
cd docker
cat > .env <<EOF
GEMINI_API_KEY=your-key
SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

docker compose up --build
```

Frontend on :3000, backend on :8000. State persists in the `backend_data`
volume — `docker compose down -v` deletes it.

To build the images by hand (note the context is the **repository root**):

```bash
docker build -f docker/backend.Dockerfile -t nexus-backend .
docker build -f docker/frontend.Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  -t nexus-frontend .
```

Add `--build-arg INSTALL_BROWSERS=true` to the backend build if you want
Playwright browser automation (adds roughly 400 MB).

---

## Production checklist

- [ ] `SECRET_KEY` is a generated random value, not the shipped default
      (startup refuses to run with `DEBUG=false` otherwise)
- [ ] `DEBUG=false` — this also stops the `admin`/`admin123` account being seeded
- [ ] `ALLOWED_ORIGINS` lists only your real frontend origin
- [ ] `ENABLE_TERMINAL_TOOL=false` — it executes shell commands server-side
- [ ] A persistent disk is mounted at `DATA_DIR`
- [ ] `/health` returns 200 and reports `gemini: configured`
- [ ] `GEMINI_API_KEY` is set in the platform's secret store, never in git

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Frontend loads, all panels show "Failed to fetch" | `NEXT_PUBLIC_API_URL` wrong or unset at build time | Fix the variable and **redeploy** |
| Browser console shows a CORS error | Origin missing from `ALLOWED_ORIGINS` | Set the exact origin on the backend, redeploy |
| Chat returns 503 | No `GEMINI_API_KEY` | Set it in the platform's environment settings |
| Uploads and memories vanish after a deploy | No persistent disk at `DATA_DIR` | Attach one (`render.yaml` does this already) |
| Backend refuses to start, complains about `SECRET_KEY` | Default key with `DEBUG=false` | Set a real `SECRET_KEY` |
| `pip install` fails on `requirements.txt` | File saved as UTF-16 by PowerShell | Keep it UTF-8; never use `pip freeze >` on Windows |
| First request after idle takes ~60 s | Render free-tier cold start | Expected; upgrade the plan to avoid |
