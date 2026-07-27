'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Brain,
  GitBranch,
  MessageSquare,
  Trash2,
  Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { apiGet } from '@/services/api';
import type { LogEntry } from '@/types/workflow';

const ICONS: Record<string, LucideIcon> = {
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ activity: LogEntry[] }>('/dashboard/activity');
      setItems(data.activity);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  return (
    <Card className="min-w-0 flex-1 p-6">
      <h3 className="text-lg font-semibold text-ink">Recent Activity</h3>
      <p className="mt-1 mb-5 text-[13px] text-ink-muted">
        Latest actions across your workspace
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12" count={4} />
        </div>
      ) : error ? (
        <p className="text-[13px] text-danger">Could not load activity: {error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          message="Upload a file or start a chat and events will show up here."
        />
      ) : (
        <div className="flex flex-col">
          {items.map((item) => {
            const Icon = ICONS[item.category] ?? Activity;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                  <Icon size={15} className="text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {item.event}
                  </p>
                  <p className="text-xs text-ink-subtle">{item.category}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-subtle">
                  {relativeTime(item.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
