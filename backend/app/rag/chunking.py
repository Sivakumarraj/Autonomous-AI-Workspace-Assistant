"""Document chunking for RAG pipeline"""

from typing import List, Dict, Any


class TextChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        idx = 0
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            chunks.append({
                "id": idx,
                "text": text[start:end],
                "start": start,
                "end": end,
            })
            idx += 1
            start += self.chunk_size - self.overlap
        return chunks

    def chunk_by_sentences(self, text: str, max_sentences: int = 5) -> List[str]:
        """Split text by sentence boundaries"""
        sentences = text.replace("!", ".").replace("?", ".").split(".")
        chunks = []
        for i in range(0, len(sentences), max_sentences):
            chunk = ". ".join(s.strip() for s in sentences[i:i + max_sentences] if s.strip())
            if chunk:
                chunks.append(chunk + ".")
        return chunks
