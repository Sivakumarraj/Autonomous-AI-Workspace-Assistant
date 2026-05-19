import os
from PyPDF2 import PdfReader


UPLOAD_FOLDER = "uploads"


def list_uploaded_files():

    files = []

    for root, dirs, filenames in os.walk(UPLOAD_FOLDER):

        for file in filenames:

            files.append(file)

    return files


def extract_text_from_pdf(file_path):

    text = ""

    reader = PdfReader(file_path)

    for page in reader.pages:

        extracted = page.extract_text()

        if extracted:
            text += extracted

    return text


def chunk_text(text, chunk_size=1000):

    chunks = []

    for i in range(0, len(text), chunk_size):

        chunks.append(
            text[i:i + chunk_size]
        )

    return chunks