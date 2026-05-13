from fastapi import APIRouter, UploadFile, File
import shutil
import os
from app.tools.file_tool import extract_text_from_pdf

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = ""

    if file.filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file_path)

    return {
        "filename": file.filename,
        "message": "File uploaded successfully",
        "text_preview": extracted_text[:1000]
    }