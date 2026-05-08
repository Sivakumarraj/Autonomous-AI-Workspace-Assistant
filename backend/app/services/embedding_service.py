"""Embedding Service - Text embedding generation"""

from typing import List
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    def __init__(self):
        self.model = settings.DEFAULT_EMBEDDING_MODEL

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        logger.info(f"Generating embedding for text ({len(text)} chars)")
        return [0.0] * 1536  # Placeholder

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        return [await self.embed_text(t) for t in texts]


embedding_service = EmbeddingService()
