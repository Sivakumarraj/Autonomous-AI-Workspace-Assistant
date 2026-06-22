import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

_client = None

def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client

async def generate_response(message: str):
    response = get_client().models.generate_content(
        model="gemini-2.5-flash",
        contents=message
    )
    return response.text
