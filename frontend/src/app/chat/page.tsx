'use client';

import { useCallback, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/components/providers/ToastProvider';
import ChatInput from '@/components/chat/ChatInput';
import ChatWindow from '@/components/chat/ChatWindow';
import type { ChatMessage } from '@/components/chat/MessageBubble';
import Button from '@/components/ui/Button';
import { sendMessage } from '@/services/chatService';

let messageId = 0;
const nextId = () => `m${messageId++}`;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const { preferences } = usePreferences();
  const { toast } = useToast();

  const handleSend = useCallback(
    async (text: string) => {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: 'user', content: text },
      ]);
      setSending(true);

      try {
        const data = await sendMessage(text);

        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            content: data.response,
            mode: data.mode,
            chunks: data.retrieved_chunks,
          },
        ]);

        if (data.memory_saved) {
          toast(`Remembered: ${data.memory_saved}`, 'info');
        }
      } catch (error) {
        // The backend's own message is far more useful than a generic string —
        // it names a missing GEMINI_API_KEY, for instance.
        const message =
          error instanceof Error ? error.message : 'Request failed.';
        setMessages((current) => [
          ...current,
          { id: nextId(), role: 'assistant', content: message, isError: true },
        ]);
      } finally {
        setSending(false);
      }
    },
    [toast],
  );

  return (
    <div className="flex h-full flex-col p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">AI Chat</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Answers use your uploaded documents and saved memories.
          </p>
        </div>

        {messages.length > 0 && (
          <Button icon={<Trash2 size={14} />} onClick={() => setMessages([])}>
            Clear
          </Button>
        )}
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <ChatWindow
          messages={messages}
          sending={sending}
          showSources={preferences.showChatSources}
        />
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
