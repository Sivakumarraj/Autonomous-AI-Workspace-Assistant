"""Upload security and behaviour."""

from pathlib import Path

import pytest

from app.core.config import settings


def _pdf_bytes() -> bytes:
    """A minimal single-page PDF whose text layer reads 'Nexus test document'."""
    content = "BT /F1 12 Tf 40 750 Td (Nexus test document) Tj ET"
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        f"<< /Length {len(content)} >>\nstream\n{content}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = "%PDF-1.4\n"
    offsets = []
    for index, obj in enumerate(objects, 1):
        offsets.append(len(out))
        out += f"{index} 0 obj\n{obj}\nendobj\n"

    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    out += "".join(f"{offset:010d} 00000 n \n" for offset in offsets)
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n"
    )
    return out.encode("latin-1")


def test_upload_stores_file_and_extracts_text(client):
    response = client.post(
        "/upload", files={"file": ("notes.txt", b"Nexus workspace notes", "text/plain")}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "notes.txt"
    # No API key in tests, so embedding is skipped — but the file is still kept
    # and the response says why rather than silently claiming success.
    assert body["vector_storage"] == "skipped"
    assert "GEMINI_API_KEY" in body["warning"]

    listed = client.get("/files").json()
    assert any(item["filename"] == "notes.txt" for item in listed)


def test_upload_accepts_pdf(client):
    response = client.post(
        "/upload", files={"file": ("doc.pdf", _pdf_bytes(), "application/pdf")}
    )

    assert response.status_code == 200
    assert response.json()["filename"] == "doc.pdf"


@pytest.mark.parametrize(
    "malicious_name",
    [
        "../../../../etc/passwd.txt",
        "..\\..\\windows\\system32\\evil.txt",
        "/etc/cron.d/backdoor.txt",
    ],
)
def test_path_traversal_is_contained(client, malicious_name, tmp_path):
    """A filename with directory components must not escape UPLOAD_DIR.

    The original code passed request-supplied `file.filename` straight into
    os.path.join, so `../../x` wrote outside the upload directory.
    """
    response = client.post(
        "/upload", files={"file": (malicious_name, b"payload", "text/plain")}
    )

    assert response.status_code == 200
    stored = settings.UPLOAD_DIR / response.json()["stored_name"]

    assert stored.exists()
    # The resolved path must still sit inside the upload directory.
    assert stored.resolve().is_relative_to(settings.UPLOAD_DIR.resolve())
    assert "/" not in response.json()["filename"]
    assert "\\" not in response.json()["filename"]


def test_disallowed_extension_is_rejected(client):
    response = client.post(
        "/upload", files={"file": ("payload.sh", b"#!/bin/sh\nrm -rf /", "text/x-sh")}
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_empty_file_is_rejected(client):
    response = client.post("/upload", files={"file": ("empty.txt", b"", "text/plain")})

    assert response.status_code == 400


def test_oversized_upload_is_rejected(client, monkeypatch):
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE", 32, raising=False)

    response = client.post(
        "/upload", files={"file": ("big.txt", b"x" * 5000, "text/plain")}
    )

    assert response.status_code == 413


def test_delete_removes_record_and_bytes(client):
    uploaded = client.post(
        "/upload", files={"file": ("gone.txt", b"temporary", "text/plain")}
    ).json()

    path = Path(settings.UPLOAD_DIR) / uploaded["stored_name"]
    assert path.exists()

    assert client.delete(f"/files/{uploaded['id']}").status_code == 200
    assert not path.exists()
    assert client.delete(f"/files/{uploaded['id']}").status_code == 404
