'use client';

import { useChatStore } from '@/store/chatStore';

export function useChat() {
  const store = useChatStore();
  return {
    conversations: store.conversations,
    activeConversationId: store.activeConversationId,
    activeConversation: store.conversations.find((c) => c.id === store.activeConversationId),
    setActiveConversation: store.setActiveConversation,
    addConversation: store.addConversation,
    addMessage: store.addMessage,
    searchQuery: store.searchQuery,
    setSearchQuery: store.setSearchQuery,
  };
}
