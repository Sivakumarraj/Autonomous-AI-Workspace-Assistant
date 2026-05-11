import google.generativeai as genai


def generate_embedding(text: str):

    response = genai.embed_content(
        model="models/embedding-001",
        content=text
    )

    embedding = response["embedding"]

    return list(embedding)