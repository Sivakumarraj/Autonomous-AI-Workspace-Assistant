"""Browser Workflow - automated search, extraction, and summarization."""

from __future__ import annotations

from typing import Any, Dict

from app.core.logging import get_logger
from app.tools.browser_tool import browser_tool

logger = get_logger(__name__)


class BrowserWorkflow:
    async def run(self, task: str) -> Dict[str, Any]:
        task_l = task.lower().strip()
        logger.info("Running browser workflow", extra={"task": task})

        if task_l.startswith("google search"):
            query = task[len("google search") :].strip()
            results = await browser_tool.google_search(query=query)
            return {"type": "google_search", "query": query, "results": results}

        if task_l.startswith("extract webpage"):
            url = task[len("extract webpage") :].strip()
            data = await browser_tool.extract_webpage(url=url)
            return {"type": "extract_webpage", "data": data}

        if task_l.startswith("summarize webpage"):
            url = task[len("summarize webpage") :].strip()
            summary = await browser_tool.summarize_webpage(url=url)
            return {"type": "summarize_webpage", "data": summary}

        return {"type": "unsupported_browser_task", "status": "ignored"}


browser_workflow = BrowserWorkflow()
