'use client';

import { useEffect, useRef, useState } from 'react';
import { sendMessage as sendChatMessage } from '@/services/chatService';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  mode?: string;
  chunks?: string[];
  isError?: boolean;
}

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setMessage('');
    setSending(true);

    try {
      const data = await sendChatMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: data.response,
          mode: data.mode,
          chunks: data.retrieved_chunks,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          // The backend's message is far more useful than a generic string —
          // e.g. it names a missing GEMINI_API_KEY.
          content: error instanceof Error ? error.message : 'Request failed.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Workspace Chat</h1>

        <div
          ref={scrollRef}
          className="border border-zinc-800 rounded-xl p-4 h-[500px] overflow-y-auto bg-zinc-900 mb-4"
        >
          {messages.length === 0 && (
            <p className="text-zinc-500">
              Start chatting with Gemini. Upload a document first and ask about it
              to see retrieval in action.
            </p>
          )}

          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 ml-auto'
                    : msg.isError
                      ? 'bg-red-900/50 border border-red-700'
                      : 'bg-zinc-800'
                }`}
              >
                <p className="text-sm mb-1 font-semibold">
                  {msg.role === 'user' ? 'You' : 'AI'}
                  {msg.mode && msg.mode !== 'general' && (
                    <span className="ml-2 text-xs font-normal text-purple-300">
                      via {msg.mode}
                    </span>
                  )}
                </p>

                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.chunks && msg.chunks.length > 0 && (
                  <details className="mt-2 text-xs text-zinc-400">
                    <summary className="cursor-pointer">
                      {msg.chunks.length} source chunk
                      {msg.chunks.length === 1 ? '' : 's'}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {msg.chunks.map((chunk, i) => (
                        <p key={i} className="whitespace-pre-wrap border-l-2 border-zinc-700 pl-2">
                          {chunk}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}

            {sending && <p className="text-zinc-500 text-sm">AI is thinking...</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none disabled:opacity-60"
            value={message}
            disabled={sending}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />

          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 px-6 py-3 rounded-xl font-semibold"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
