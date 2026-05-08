'use client';

import { Search, Plus } from 'lucide-react';
import { useState } from 'react';
import MemoryCard from '@/components/memory/MemoryCard';
import { MOCK_MEMORY } from '@/utils/constants';

export default function MemoryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_MEMORY.filter(
    (m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Memory
          </h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>
            AI memory and context points extracted from your interactions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#141428',
              border: '1px solid #1e1e3a',
              width: '220px',
            }}
          >
            <Search size={14} color="#555577" />
            <input
              type="text"
              placeholder="Search memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#8888aa',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={16} />
            Add Memory
          </button>
        </div>
      </div>

      {/* Memory Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.map((entry, i) => (
          <MemoryCard key={entry.id} entry={entry} index={i} />
        ))}
      </div>
    </div>
  );
}
