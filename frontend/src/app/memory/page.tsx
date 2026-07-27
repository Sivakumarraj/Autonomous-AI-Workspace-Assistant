'use client';

import { useCallback, useEffect, useState } from 'react';
import MemoryCard from '@/components/memory/MemoryCard';
import { getMemories } from '@/services/memoryService';
import type { MemoryEntry } from '@/types/workflow';

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Nothing sets state before the first await, so this is safe to call from an
  // effect (react-hooks/set-state-in-effect).
  const loadMemories = useCallback(async () => {
    try {
      const data = await getMemories();
      setMemories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadMemories(); }, [loadMemories]);

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
        Memory
      </h1>
      <p style={{ fontSize: '15px', color: '#666688', marginBottom: '28px' }}>
        Facts the assistant has learned and recalls in future conversations.
      </p>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: 'rgba(244, 67, 54, 0.12)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#f44336', fontSize: '14px' }}>
          Could not load memories: {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {memories.map((entry, index) => (
          <MemoryCard key={entry.id} entry={entry} index={index} />
        ))}
      </div>

      {!loading && memories.length === 0 && !error && (
        <p style={{ color: '#555577', textAlign: 'center', marginTop: '48px' }}>
          No memories yet. Tell the assistant something like &quot;I prefer FastAPI
          for backends&quot; in chat and it will be saved here.
        </p>
      )}
    </div>
  );
}
