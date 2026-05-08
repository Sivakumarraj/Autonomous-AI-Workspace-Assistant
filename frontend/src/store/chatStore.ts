'use client';

import { create } from 'zustand';
import { MOCK_CONVERSATIONS } from '@/utils/constants';
import type { Conversation, Message } from '@/types/chat';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  searchQuery: string;
  setActiveConversation: (id: string) => void;
  setSearchQuery: (query: string) => void;
  addConversation: (title: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: MOCK_CONVERSATIONS,
  activeConversationId: '1',
  searchQuery: '',
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addConversation: (title) =>
    set((state) => ({
      conversations: [
        {
          id: String(Date.now()),
          title,
          messageCount: 0,
          lastUpdated: new Date().toLocaleDateString(),
          messages: [],
        },
        ...state.conversations,
      ],
    })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], messageCount: c.messageCount + 1 }
          : c
      ),
    })),
}));
