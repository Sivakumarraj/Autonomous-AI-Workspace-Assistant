import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client

def generate_embedding(text: str):
    response = get_client().models.embed_content(
        model="gemini-embedding-001",
        contents=text,
    )
    return response.embeddings[0].values
