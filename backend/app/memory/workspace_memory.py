"""Long-term workspace memory: durable facts the assistant recalls per request."""


from app.database.memory_db import (
    add_memory,
    delete_memory,
    get_memories,
)

CATEGORY_ICONS = {
    "User Preference": "👤",
    "Project Context": "📁",
    "Technical Note": "🔧",
    "Workflow Pattern": "⚙️",
    "Code Pattern": "💻",
    "General Knowledge": "📚",
}

DEFAULT_ICON = "📝"

# Words too common to make a match meaningful — without this filter, a query
# containing "the" matched every stored memory.
STOPWORDS = frozenset(
    {
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "do", "for",
        "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or",
        "that", "the", "to", "was", "what", "when", "where", "which", "who",
        "why", "with", "you", "your",
    }
)


class WorkspaceMemory:
    """Facade over the memories table."""

    def add_fact(
        self, category: str, content: str, source: str = "chat"
    ) -> dict:
        """Store a fact, returning the existing row if it is already known."""
        content = content.strip()

        for fact in get_memories():
            if fact["content"].lower() == content.lower():
                return fact

        return add_memory(
            category=category,
            content=content,
            source=source,
            icon=self.get_icon(category),
        )

    def get_facts(self, limit: int | None = None) -> list[dict]:
        return get_memories(limit=limit)

    def delete_fact(self, memory_id: int) -> bool:
        """Delete a fact. Returns True if a row was removed.

        This used to be `pass`, so DELETE /memory/{id} reported success while
        changing nothing.
        """
        return delete_memory(memory_id)

    def search_memories(self, query: str, limit: int = 5) -> list[dict]:
        """Return memories ranked by how many query terms they contain."""
        terms = {
            word
            for word in query.lower().split()
            if len(word) > 2 and word not in STOPWORDS
        }

        if not terms:
            return []

        scored = []
        for fact in get_memories():
            content = fact["content"].lower()
            score = sum(1 for term in terms if term in content)
            if score:
                scored.append((score, fact))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [fact for _score, fact in scored[:limit]]

    def get_icon(self, category: str) -> str:
        return CATEGORY_ICONS.get(category, DEFAULT_ICON)


workspace_memory = WorkspaceMemory()
