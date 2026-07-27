"""File upload and management routes."""

import uuid
from pathlib import Path, PurePosixPath

from anyio import to_thread
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.core.exceptions import AIUnavailableError, InvalidUploadError
from app.core.logging import get_logger
from app.database.files_db import add_file, delete_file, get_file, get_files
from app.database.logs_db import add_log
from app.rag.chunking import chunk_text
from app.services.embedding_service import embed_chunks
from app.services.vector_service import store_embeddings
from app.tools.file_tool import extract_text

logger = get_logger(__name__)

router = APIRouter()

READ_CHUNK_BYTES = 1024 * 1024  # 1 MB


class FileResponse(BaseModel):
    id: int
    filename: str
    stored_name: str = ""
    size_bytes: int = 0
    chunk_count: int = 0
    status: str = "ready"
    uploaded_at: str = ""


class UploadResponse(BaseModel):
    id: int
    filename: str
    stored_name: str
    size_bytes: int
    chunks_count: int
    embedding_dimension: int
    vector_storage: str
    message: str
    warning: str | None = None


def _safe_stored_name(original: str | None) -> tuple[str, str]:
    """Return (display_name, stored_name) for an uploaded file.

    Both separators are normalised before taking the basename: on Linux
    `Path("..\\..\\evil").name` is the whole string, so a Windows-style path
    would survive here and become a traversal the moment the same code ran on
    Windows. After that, `..` and `/` cannot appear at all, so the write is
    confined to UPLOAD_DIR. A UUID prefix then stops two uploads of the same
    name overwriting each other.
    """
    raw = (original or "upload").replace("\\", "/")
    display_name = PurePosixPath(raw).name.strip() or "upload"

    # Leading dots would still be legal but make for confusing hidden files.
    display_name = display_name.lstrip(".") or "upload"

    suffix = Path(display_name).suffix.lower()
    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise InvalidUploadError(
            f"Unsupported file type {suffix or '(none)'}. "
            f"Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}."
        )

    return display_name, f"{uuid.uuid4().hex}_{display_name}"


async def _write_upload(upload: UploadFile, destination: Path) -> int:
    """Stream the upload to disk, enforcing MAX_UPLOAD_SIZE as we go.

    Streaming rather than reading the whole body first is what stops an
    oversized upload exhausting memory before the limit is ever checked.
    """
    total = 0

    with destination.open("wb") as buffer:
        while True:
            chunk = await upload.read(READ_CHUNK_BYTES)
            if not chunk:
                break

            total += len(chunk)
            if total > settings.MAX_UPLOAD_SIZE:
                buffer.close()
                destination.unlink(missing_ok=True)
                raise InvalidUploadError(
                    "File exceeds the maximum size of "
                    f"{settings.MAX_UPLOAD_SIZE // (1024 * 1024)} MB."
                )

            buffer.write(chunk)

    return total


def _index_document(text: str, metadata: dict) -> tuple[int, int]:
    """Chunk, embed, and store a document. Returns (chunk_count, dimension)."""
    chunks = chunk_text(text)
    if not chunks:
        return 0, 0

    kept_chunks, vectors = embed_chunks(chunks)
    if not vectors:
        return 0, 0

    store_embeddings(kept_chunks, vectors, metadata=metadata)
    return len(kept_chunks), len(vectors[0])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a document, extract its text, and index it for RAG."""
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    try:
        display_name, stored_name = _safe_stored_name(file.filename)
    except InvalidUploadError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc

    destination = settings.UPLOAD_DIR / stored_name

    # Belt and braces: confirm the resolved path is still inside UPLOAD_DIR.
    if not destination.resolve().is_relative_to(settings.UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    try:
        size_bytes = await _write_upload(file, destination)
    except InvalidUploadError as exc:
        raise HTTPException(status_code=413, detail=exc.message) from exc

    if size_bytes == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    text = await to_thread.run_sync(extract_text, destination)

    warning: str | None = None
    chunk_count = 0
    dimension = 0
    status = "ready"

    if not text.strip():
        # A scanned PDF has no text layer. Keep the file, but say plainly that
        # it will not be searchable rather than reporting success.
        status = "no_text"
        warning = (
            "No text could be extracted. If this is a scanned PDF it needs OCR "
            "before it can be indexed."
        )
    else:
        metadata = {"filename": display_name, "stored_name": stored_name}
        try:
            chunk_count, dimension = await to_thread.run_sync(
                _index_document, text, metadata
            )
        except AIUnavailableError as exc:
            status = "pending_embedding"
            warning = f"Text extracted but not indexed: {exc.message}"
            logger.warning("Indexing skipped for %s: %s", display_name, exc.message)

        if status == "ready" and chunk_count == 0:
            status = "no_text"
            warning = "Document produced no indexable chunks."

    record = add_file(
        {
            "filename": display_name,
            "stored_name": stored_name,
            "size_bytes": size_bytes,
            "chunk_count": chunk_count,
            "status": status,
        }
    )

    add_log("upload", f"{display_name} uploaded ({chunk_count} chunks)")

    return UploadResponse(
        id=record["id"],
        filename=display_name,
        stored_name=stored_name,
        size_bytes=size_bytes,
        chunks_count=chunk_count,
        embedding_dimension=dimension,
        vector_storage="completed" if chunk_count else "skipped",
        message="Upload successful",
        warning=warning,
    )


@router.get("/files", response_model=list[FileResponse])
async def get_all_files():
    """List every uploaded file."""
    return await to_thread.run_sync(get_files)


@router.delete("/files/{file_id}")
async def remove_file(file_id: int):
    """Delete a file record and its bytes on disk."""
    record = await to_thread.run_sync(get_file, file_id)
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")

    if record["stored_name"]:
        path = settings.UPLOAD_DIR / record["stored_name"]
        if path.resolve().is_relative_to(settings.UPLOAD_DIR.resolve()):
            path.unlink(missing_ok=True)

    await to_thread.run_sync(delete_file, file_id)
    add_log("delete", f"{record['filename']} deleted")

    return {"message": "File deleted", "id": file_id}
