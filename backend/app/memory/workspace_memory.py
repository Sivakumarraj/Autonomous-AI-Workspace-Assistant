from datetime import datetime


class WorkspaceMemory:
    def search_memories(self, query):

        query = query.lower()

        results = []

        for fact in self.facts:

            if any(
                word in fact["content"].lower()
                for word in query.split()
            ):
                results.append(fact)

        return results          
        
    def __init__(self):
        self.facts = []
        
    def add_fact(self, category, content, source):

        memory = {
            "id": str(len(self.facts) + 1),
            "category": category,
            "content": content,
            "source": source,
            "created_at": datetime.now().strftime("%m/%d/%Y"),
            "icon": "📁"
        }

        self.facts.append(memory)

        return memory

    def get_facts(self):

        return self.facts

    def delete_fact(self, memory_id):

        self.facts = [
            fact for fact in self.facts
            if fact["id"] != memory_id
        ]


workspace_memory = WorkspaceMemory()