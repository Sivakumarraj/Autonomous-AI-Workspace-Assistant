#!/usr/bin/env bash
# One-shot local development setup.
#
#   ./scripts/setup.sh
#
# Run from anywhere; paths resolve relative to the repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Setting up Nexus AI Workspace in $ROOT"

# --- Backend -----------------------------------------------------------------
echo
echo "[1/2] Backend"
cd "$ROOT/backend"

python3 -m venv .venv

# The previous version of this script tried
#   source venv/bin/activate || venv\Scripts\activate
# which is broken on both platforms. Call the interpreter directly instead —
# no activation needed.
if [ -x ".venv/bin/python" ]; then
  PY=".venv/bin/python"          # Linux / macOS
else
  PY=".venv/Scripts/python.exe"  # Windows (Git Bash)
fi

"$PY" -m pip install --upgrade pip --quiet
"$PY" -m pip install -r requirements.txt

[ -f .env ] || { cp .env.example .env; echo "  created backend/.env — add your GEMINI_API_KEY"; }

# --- Frontend ----------------------------------------------------------------
echo
echo "[2/2] Frontend"
cd "$ROOT/frontend"

npm install

[ -f .env.local ] || { cp .env.example .env.local; echo "  created frontend/.env.local"; }

# --- Done --------------------------------------------------------------------
cat <<EOF

Setup complete.

  Backend:   cd backend && .venv/bin/python -m uvicorn app.main:app --reload
  Frontend:  cd frontend && npm run dev

  API docs:  http://localhost:8000/docs
  App:       http://localhost:3000

Add your GEMINI_API_KEY to backend/.env to enable chat and RAG.
Without it the app still runs; AI endpoints return 503.
EOF
