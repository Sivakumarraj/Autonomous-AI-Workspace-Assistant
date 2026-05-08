"""Retrieval module for RAG"""

from typing import List, Dict, Any
from app.services.vector_service import vector_service
from app.services.embedding_service import embedding_service


class Retriever:
    async def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant documents for a query"""
        query_embedding = await embedding_service.embed_text(query)
        results = await vector_service.search(query_embedding, top_k=top_k)
        return [{"doc_id": doc_id, "score": score} for doc_id, score in results]


retriever = Retriever()
