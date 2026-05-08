"""Workspace memory - persistent facts about the workspace"""

from typing import List, Dict, Any


class WorkspaceMemory:
    def __init__(self):
        self.facts: List[Dict[str, Any]] = []

    def add_fact(self, category: str, content: str, source: str):
        self.facts.append({"category": category, "content": content, "source": source})

    def get_facts(self, category: str = None) -> List[Dict[str, Any]]:
        if category:
            return [f for f in self.facts if f["category"] == category]
        return self.facts

    def search(self, query: str) -> List[Dict[str, Any]]:
        return [f for f in self.facts if query.lower() in f["content"].lower()]


workspace_memory = WorkspaceMemory()
