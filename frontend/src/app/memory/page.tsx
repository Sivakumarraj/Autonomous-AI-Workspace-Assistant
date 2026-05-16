'use client';

import { useEffect, useState } from 'react';
import MemoryCard from '@/components/memory/MemoryCard';
import { getMemories } from '@/services/memoryService';

export default function MemoryPage() {

  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
  async function loadMemories() {
    const data = await getMemories();
    setMemories(data);
  }

  loadMemories();
}, []);

  return (
    <div style={{ padding: '32px' }}>

      <h1
        style={{
          fontSize: '32px',
          color: 'white',
          marginBottom: '24px',
        }}
      >
        Memory
      </h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {memories.map((entry: any, index) => (
          <MemoryCard
            key={entry.id}
            entry={entry}
            index={index}
          />
        ))}
      </div>

    </div>
  );
}