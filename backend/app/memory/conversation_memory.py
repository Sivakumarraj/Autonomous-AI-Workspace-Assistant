"""Conversation memory management"""

from typing import List, Dict, Any


class ConversationMemory:
    def __init__(self, max_messages: int = 50):
        self.max_messages = max_messages
        self.conversations: Dict[str, List[Dict[str, str]]] = {}

    def add_message(self, conversation_id: str, role: str, content: str):
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        self.conversations[conversation_id].append({"role": role, "content": content})
        if len(self.conversations[conversation_id]) > self.max_messages:
            self.conversations[conversation_id] = self.conversations[conversation_id][-self.max_messages:]

    def get_history(self, conversation_id: str, last_n: int = 10) -> List[Dict[str, str]]:
        return self.conversations.get(conversation_id, [])[-last_n:]

    def clear(self, conversation_id: str):
        self.conversations.pop(conversation_id, None)


conversation_memory = ConversationMemory()
