"""File tool - File operations for the AI agent"""

import os
import shutil
from typing import List, Dict, Any
from app.core.config import settings


class FileTool:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR

    async def read_file(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    async def write_file(self, path: str, content: str) -> Dict[str, Any]:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"path": path, "status": "written"}

    async def list_files(self, directory: str = None) -> List[str]:
        target = directory or self.upload_dir
        if not os.path.exists(target):
            return []
        return os.listdir(target)

    async def delete_file(self, path: str) -> Dict[str, Any]:
        if os.path.exists(path):
            os.remove(path)
        return {"path": path, "status": "deleted"}
