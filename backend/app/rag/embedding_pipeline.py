"""Embedding pipeline for document processing"""

from typing import List, Dict, Any
from app.rag.chunking import TextChunker
from app.services.embedding_service import embedding_service


class EmbeddingPipeline:
    def __init__(self):
        self.chunker = TextChunker()

    async def process_document(self, text: str, doc_id: str) -> List[Dict[str, Any]]:
        """Process a document: chunk and embed"""
        chunks = self.chunker.chunk_text(text)
        results = []
        for chunk in chunks:
            embedding = await embedding_service.embed_text(chunk["text"])
            results.append({
                "doc_id": doc_id,
                "chunk_id": chunk["id"],
                "text": chunk["text"],
                "embedding": embedding,
            })
        return results


embedding_pipeline = EmbeddingPipeline()
