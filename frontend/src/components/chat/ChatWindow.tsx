'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import MessageBubble, { type ChatMessage } from './MessageBubble';
import TypingAnimation from './TypingAnimation';

export default function ChatWindow({
  messages,
  sending,
  showSources,
}: {
  messages: ChatMessage[];
  sending: boolean;
  showSources: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  return (
    <div
      ref={scrollRef}
      data-testid="chat-transcript"
      className="flex-1 overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface-sunken p-4"
    >
      {messages.length === 0 && !sending ? (
        <EmptyState
          icon={MessageSquare}
          title="Start a conversation"
          message="Ask anything. Upload a document on the Files tab first and questions about it will be answered from its contents."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showSources={showSources}
            />
          ))}
          {sending && <TypingAnimation />}
        </div>
      )}
    </div>
  );
}
