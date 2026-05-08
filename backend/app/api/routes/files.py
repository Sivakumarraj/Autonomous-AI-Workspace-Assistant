"""
Files API routes
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from pydantic import BaseModel
import os
from app.core.config import settings

router = APIRouter()


class FileResponse(BaseModel):
    id: str
    name: str
    size: str
    type: str
    status: str
    uploaded_at: str


# In-memory file store
files_db: dict = {}


@router.get("/", response_model=List[FileResponse])
async def get_files():
    """Get all uploaded files"""
    return list(files_db.values())


@router.post("/upload", response_model=FileResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a file"""
    # Validate file extension
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext not in {"pdf", "docx", "csv", "txt", "png", "jpg"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # Determine upload directory
    type_dirs = {"pdf": "pdfs", "docx": "docs", "csv": "docs", "txt": "docs", "png": "images", "jpg": "images"}
    upload_dir = os.path.join(settings.UPLOAD_DIR, type_dirs.get(ext, "temp"))
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_path = os.path.join(upload_dir, file.filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create record
    file_id = str(len(files_db) + 1)
    size = len(content)
    size_str = f"{size / 1024:.0f} KB" if size < 1024 * 1024 else f"{size / (1024 * 1024):.2f} MB"

    file_record = FileResponse(
        id=file_id,
        name=file.filename or "unknown",
        size=size_str,
        type=ext,
        status="processing",
        uploaded_at="today",
    )
    files_db[file_id] = file_record
    return file_record


@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete a file"""
    if file_id not in files_db:
        raise HTTPException(status_code=404, detail="File not found")
    del files_db[file_id]
    return {"message": "File deleted successfully"}
