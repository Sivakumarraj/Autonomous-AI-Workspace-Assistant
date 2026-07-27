"""File inspection and text-extraction helpers."""

import os
from pathlib import Path

from pypdf import PdfReader

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def list_uploaded_files() -> list[str]:
    """Return the names of every file currently in the upload directory."""
    upload_dir = settings.UPLOAD_DIR

    if not upload_dir.exists():
        return []

    return [
        filename
        for _root, _dirs, filenames in os.walk(upload_dir)
        for filename in filenames
    ]


def extract_text_from_pdf(file_path) -> str:
    """Extract all selectable text from a PDF.

    Returns an empty string for scanned/image-only PDFs, which have no text
    layer. Callers must handle that case rather than assuming text exists.
    """
    parts: list[str] = []

    try:
        reader = PdfReader(str(file_path))
    except Exception:
        logger.exception("Failed to open PDF: %s", file_path)
        return ""

    for page in reader.pages:
        try:
            extracted = page.extract_text()
        except Exception:
            logger.warning("Unreadable page in %s, skipping", file_path)
            continue
        if extracted:
            parts.append(extracted)

    return "\n".join(parts)


def extract_text_from_plaintext(file_path) -> str:
    """Read a .txt/.md file, tolerating bad bytes."""
    return Path(file_path).read_text(encoding="utf-8", errors="replace")


def extract_text(file_path) -> str:
    """Dispatch to the right extractor based on file extension."""
    suffix = Path(file_path).suffix.lower()

    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)
    if suffix in {".txt", ".md"}:
        return extract_text_from_plaintext(file_path)

    logger.warning("No extractor for extension %r", suffix)
    return ""
