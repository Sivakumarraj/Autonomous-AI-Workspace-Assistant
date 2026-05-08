'use client';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: '10px',
        alignItems: 'flex-start',
        animation: isUser ? 'slideInRight 0.3s ease-out' : 'slideInLeft 0.3s ease-out',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#1e1e3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '4px',
            fontSize: '14px',
          }}
        >
          🤖
        </div>
      )}
      <div
        style={{
          maxWidth: '70%',
          padding: '14px 18px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: isUser ? '#6c5ce7' : '#1a1a35',
          color: '#fff',
          fontSize: '14px',
          lineHeight: '1.6',
          border: isUser ? 'none' : '1px solid #1e1e3a',
        }}
      >
        {content}
      </div>
      {isUser && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#2a2a4a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '4px',
            fontSize: '14px',
          }}
        >
          👤
        </div>
      )}
    </div>
  );
}
