'use client';

import { useEffect, useState } from 'react';
import { Upload, MessageSquare, GitBranch, Brain, Activity, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiGet } from '@/services/api';
import type { LogEntry } from '@/types/workflow';

const iconMap: Record<string, LucideIcon> = {
  upload: Upload,
  chat: MessageSquare,
  workflow: GitBranch,
  memory: Brain,
  delete: Trash2,
};

/** Render an ISO timestamp as a short relative age, e.g. "5 min ago". */
function relativeTime(iso: string): string {
  if (!iso) return '';

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

export default function ActivityFeed() {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ activity: LogEntry[] }>('/dashboard/activity')
      .then((data) => { setItems(data.activity); setError(null); })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #1e1e3a',
        flex: 1,
        minWidth: 0,
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
        Recent Activity
      </h3>
      <p style={{ fontSize: '13px', color: '#666688', marginBottom: '20px' }}>
        Latest actions across your workspace
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <p style={{ fontSize: '13px', color: '#f44336' }}>Could not load activity: {error}</p>
        )}

        {!error && items.length === 0 && (
          <p style={{ fontSize: '13px', color: '#555577' }}>
            No activity yet. Upload a file or start a chat.
          </p>
        )}

        {items.map((item) => {
          const Icon = iconMap[item.category] || Activity;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                borderBottom: '1px solid #1a1a35',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(108, 92, 231, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#6c5ce7" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#ddd' }}>{item.event}</div>
                <div style={{ fontSize: '12px', color: '#666688' }}>{item.category}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#555577', flexShrink: 0 }}>
                {relativeTime(item.created_at)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
