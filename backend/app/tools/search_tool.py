"""Search tool - Web and document search"""

from typing import Any


class SearchTool:
    async def web_search(self, query: str, max_results: int = 5) -> list[dict[str, Any]]:
        """Search the web"""
        return [{"title": f"Result for {query}", "url": "#", "snippet": "..."}]

    async def document_search(self, query: str, doc_ids: list[str] = None) -> list[dict[str, Any]]:
        """Search within uploaded documents"""
        return []
