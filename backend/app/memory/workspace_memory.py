from datetime import datetime

from app.database.memory_db import (
    add_memory,
    get_memories,
)


class WorkspaceMemory:

    def add_fact(self, category, content, source):

        memories = get_memories()

        # DUPLICATE PREVENTION
        for fact in memories:

            if fact["content"].lower() == content.lower():
                return fact

        created_at = datetime.now().strftime("%m/%d/%Y")

        icon = self.get_icon(category)

        add_memory(
            category,
            content,
            source,
            created_at,
            icon
        )

        updated_memories = get_memories()

        return updated_memories[0]

    def get_facts(self):

        return get_memories()

    def delete_fact(self, memory_id):

        pass

    def search_memories(self, query):

        query = query.lower()

        memories = get_memories()

        results = []

        for fact in memories:

            content = fact["content"].lower()

            if any(
                word in content
                for word in query.split()
            ):
                results.append(fact)

        return results

    def get_icon(self, category):

        icons = {
            "User Preference": "👤",
            "Project Context": "📁",
            "Technical Note": "🔧",
            "Workflow Pattern": "⚙️",
            "Code Pattern": "💻",
            "General Knowledge": "📚",
        }

        return icons.get(category, "📝")


workspace_memory = WorkspaceMemory()