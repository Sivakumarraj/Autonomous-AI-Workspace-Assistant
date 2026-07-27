# Backend image. Build context is the repository root:
#   docker build -f docker/backend.Dockerfile -t nexus-backend .
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# --- Dependencies ------------------------------------------------------------
# Copied on their own so this layer is cached whenever only source changes.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Browser automation is opt-in: Chromium plus its system libraries add roughly
# 400 MB that most deployments do not need.
#   docker build --build-arg INSTALL_BROWSERS=true ...
ARG INSTALL_BROWSERS=false
RUN if [ "$INSTALL_BROWSERS" = "true" ]; then \
        playwright install --with-deps chromium; \
    fi

# --- Application -------------------------------------------------------------
COPY backend/app ./app

# Runtime data (SQLite, ChromaDB, uploads, logs) lives here. Mount a volume or a
# platform disk at this path so it survives container restarts.
ENV DATA_DIR=/data

RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /app /data
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import os,sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+os.getenv('PORT','8000')+'/health',timeout=4).status==200 else 1)"

# $PORT is injected by Render and most other PaaS platforms; default to 8000.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
