'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <div style={{ padding: '16px 24px', borderTop: '1px solid #1e1e3a' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message your AI..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: '#141428',
            border: '1px solid #1e1e3a',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e3a')}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: message.trim() ? 'linear-gradient(135deg, #6c5ce7, #a855f7)' : '#1e1e3a',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          <Send size={18} color="#fff" />
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#555577' }}>
        AI responses can be inaccurate. Please verify important information.
      </div>
    </div>
  );
}
