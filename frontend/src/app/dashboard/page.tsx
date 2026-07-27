'use client';

import { useCallback, useEffect, useState } from 'react';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import StatsCard from '@/components/dashboard/StatsCard';
import Skeleton from '@/components/ui/Skeleton';
import { apiGet } from '@/services/api';

interface DashboardStats {
  total_files: number;
  memory_entries: number;
  logs_today: number;
  active_workflows: number;
  conversations: number;
  completed_tasks: number;
}

const EMPTY_STATS: DashboardStats = {
  total_files: 0,
  memory_entries: 0,
  logs_today: 0,
  active_workflows: 0,
  conversations: 0,
  completed_tasks: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setStats(await apiGet<DashboardStats>('/dashboard/stats'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
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

  const tiles = [
    {
      label: 'Active Workflows',
      value: stats.active_workflows,
      description: 'Currently running automated tasks',
      icon: 'workflow',
    },
    {
      label: 'Total Files',
      value: stats.total_files,
      description: 'Documents indexed for retrieval',
      icon: 'file',
    },
    {
      label: 'Memory Entries',
      value: stats.memory_entries,
      description: 'Facts recalled in future chats',
      icon: 'memory',
    },
    {
      label: 'Events Logged',
      value: stats.conversations,
      description: 'Total workspace events recorded',
      icon: 'chat',
    },
    {
      label: 'Logs Today',
      value: stats.logs_today,
      description: 'System events recorded today',
      icon: 'log',
    },
    {
      label: 'Completed Tasks',
      value: stats.completed_tasks,
      description: 'Successfully finished workflows',
      icon: 'check',
    },
  ];

  return (
    <div className="p-6 pb-12 sm:p-8">
      <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1.5 mb-7 text-[15px] text-ink-muted">
        Welcome back. Here&apos;s an overview of your workspace.
      </p>

      {error && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          Could not reach the backend: {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {loading ? (
          <Skeleton className="h-32" count={6} />
        ) : (
          tiles.map((tile, i) => (
            <StatsCard key={tile.label} {...tile} index={i} />
          ))
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <ActivityFeed />
        <QuickActions />
      </div>
    </div>
  );
}
