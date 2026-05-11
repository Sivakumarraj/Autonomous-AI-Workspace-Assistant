from fastapi import APIRouter, UploadFile, File
import shutil
import os

from app.tools.file_tool import extract_text_from_pdf
from app.rag.chunking import chunk_text
from app.services.embedding_service import generate_embedding
from app.services.vector_service import store_embeddings

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = ""

    if file.filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(
            file_path
        )

    chunks = chunk_text(extracted_text)

    embeddings = []

    for chunk in chunks:

        embedding = generate_embedding(chunk)

        embeddings.append(embedding)

    store_embeddings(chunks, embeddings)

    return {
        "filename": file.filename,
        "message": "Upload successful",
        "chunks_count": len(chunks),
        "embedding_dimension": len(embeddings[0]),
        "vector_storage": "completed"
    }