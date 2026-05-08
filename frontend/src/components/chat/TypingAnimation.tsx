'use client';

export default function TypingAnimation() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#1e1e3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        🤖
      </div>
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '14px 18px',
          backgroundColor: '#1a1a35',
          borderRadius: '16px 16px 16px 4px',
          border: '1px solid #1e1e3a',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#6c5ce7',
              animation: `typing-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
