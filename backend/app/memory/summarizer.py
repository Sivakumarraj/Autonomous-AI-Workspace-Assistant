"""Summarizer - Summarize conversations and documents"""

from app.core.logging import get_logger

logger = get_logger(__name__)


class Summarizer:
    async def summarize_conversation(self, messages: list) -> str:
        """Summarize a conversation"""
        if not messages:
            return ""
        content = " ".join(m.get("content", "") for m in messages[-10:])
        return f"Summary of {len(messages)} messages: {content[:200]}..."

    async def summarize_document(self, text: str, max_length: int = 500) -> str:
        """Summarize a document"""
        return text[:max_length] + "..." if len(text) > max_length else text


summarizer = Summarizer()
