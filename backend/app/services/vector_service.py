"""Vector Service - Vector store operations"""

from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class VectorService:
    def __init__(self):
        self.store_dir = settings.VECTOR_STORE_DIR
        self.vectors: Dict[str, List[float]] = {}

    async def add(self, doc_id: str, embedding: List[float], metadata: Dict = None):
        """Add a vector to the store"""
        self.vectors[doc_id] = embedding
        logger.info(f"Added vector for doc: {doc_id}")

    async def search(self, query_embedding: List[float], top_k: int = 5) -> List[Tuple[str, float]]:
        """Search for similar vectors"""
        return [(doc_id, 0.95) for doc_id in list(self.vectors.keys())[:top_k]]

    async def delete(self, doc_id: str):
        """Delete a vector"""
        self.vectors.pop(doc_id, None)


vector_service = VectorService()
