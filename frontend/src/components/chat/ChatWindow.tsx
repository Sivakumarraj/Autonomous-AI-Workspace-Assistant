'use client';

import { useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingAnimation from './TypingAnimation';
import { useChatStore } from '@/store/chatStore';
import { MessageSquare } from 'lucide-react';

export default function ChatWindow() {
  const { conversations, activeConversationId, addMessage } = useChatStore();
  const [isTyping, setIsTyping] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSend = (content: string) => {
    if (!activeConversationId) return;

    const userMessage = {
      id: String(Date.now()),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    addMessage(activeConversationId, userMessage);

    setIsTyping(true);
    setTimeout(() => {
      const aiMessage = {
        id: String(Date.now() + 1),
        role: 'assistant' as const,
        content: `I understand your question about "${content.substring(0, 50)}". Let me analyze that for you. Based on my knowledge, here's a comprehensive response that addresses your query.`,
        timestamp: new Date(),
      };
      addMessage(activeConversationId, aiMessage);
      setIsTyping(false);
    }, 1500);
  };

  if (!activeConversation) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555577',
          gap: '12px',
        }}
      >
        <MessageSquare size={48} />
        <p style={{ fontSize: '16px' }}>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Chat Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #1e1e3a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <MessageSquare size={18} color="#8888aa" />
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
          {activeConversation.title}
        </h2>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {activeConversation.messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isTyping && <TypingAnimation />}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
