from fastapi import (
    APIRouter,
    UploadFile,
    File
)

import shutil
import os

from app.tools.file_tool import (
    extract_text_from_pdf
)

from app.rag.chunking import (
    chunk_text
)

from app.services.embedding_service import (
    generate_embedding
)

from app.services.vector_service import (
    store_embeddings
)

from app.database.files_db import (
    add_file,
    get_files
)

from app.database.logs_db import (
    add_log
)

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# UPLOAD FILE

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    extracted_text = ""

    if file.filename.endswith(".pdf"):

        extracted_text = extract_text_from_pdf(
            file_path
        )

    chunks = chunk_text(
        extracted_text
    )

    embeddings = []

    for chunk in chunks:

        if chunk.strip():

            try:

                embedding = generate_embedding(
                    chunk
                )

                embeddings.append(
                    embedding
                )

            except Exception as e:

                print(
                    f"Embedding error: {e}"
                )

    if embeddings:

        store_embeddings(
            chunks,
            embeddings
        )

    # SAVE FILE METADATA

    add_file({
        "filename": file.filename,
        "status": "ready"
    })

    # ADD LOG

    add_log(
        "upload",
        f"{file.filename} uploaded"
    )

    return {

        "filename": file.filename,

        "message": "Upload successful",

        "chunks_count": len(chunks),

        "embedding_dimension":
            len(embeddings[0])
            if embeddings else 0,

        "vector_storage":
            "completed"
            if embeddings else "failed"
    }


# GET FILES

@router.get("/files")
async def get_all_files():

    return get_files()