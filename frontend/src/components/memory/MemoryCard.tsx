'use client';

import type { MemoryEntry } from '@/types/workflow';

interface MemoryCardProps {
  entry: MemoryEntry;
  index: number;
}

export default function MemoryCard({ entry, index }: MemoryCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '1px solid #1e1e3a',
        transition: 'all 0.3s ease',
        animation: `fadeIn 0.3s ease-out ${index * 0.08}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#2a2a5a';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e1e3a';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px' }}>{entry.icon}</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(108, 92, 231, 0.12)',
            color: '#6c5ce7',
          }}
        >
          {entry.category}
        </span>
      </div>
      <p style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.6, marginBottom: '12px' }}>
        {entry.content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#555577' }}>Source: {entry.source}</span>
        <span style={{ fontSize: '12px', color: '#555577' }}>{entry.createdAt}</span>
      </div>
    </div>
  );
}
