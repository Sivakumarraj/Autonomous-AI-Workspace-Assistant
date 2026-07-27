"""Indexing module for RAG pipeline"""

from typing import Any

from app.core.logging import get_logger
from app.rag.embedding_pipeline import embedding_pipeline
from app.services.vector_service import vector_service

logger = get_logger(__name__)


class Indexer:
    async def index_document(self, doc_id: str, text: str) -> dict[str, Any]:
        """Index a document for retrieval"""
        logger.info(f"Indexing document: {doc_id}")
        chunks = await embedding_pipeline.process_document(text, doc_id)
        for chunk in chunks:
            await vector_service.add(
                f"{doc_id}_{chunk['chunk_id']}",
                chunk["embedding"],
                {"doc_id": doc_id, "text": chunk["text"]},
            )
        return {"doc_id": doc_id, "chunks_indexed": len(chunks)}

    async def remove_document(self, doc_id: str):
        """Remove a document from the index"""
        await vector_service.delete(doc_id)
        logger.info(f"Removed document from index: {doc_id}")


indexer = Indexer()
