'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Pause,
  Play,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/hooks/usePreferences';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { apiGet } from '@/services/api';
import type { LogEntry } from '@/types/workflow';

const LEVELS = ['info', 'success', 'warning', 'error'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_ICONS: Record<string, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const LEVEL_STYLES: Record<string, string> = {
  info: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warn-soft text-warn',
  error: 'bg-danger-soft text-danger',
};

/** Auto-refresh runs on a fixed cadence when enabled in Settings. */
const FALLBACK_INTERVAL = 10;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [levels, setLevels] = useState<Set<Level>>(new Set());
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { preferences, update } = usePreferences();
  const autoRefresh = preferences.logsRefreshInterval > 0;
  const intervalSeconds = preferences.logsRefreshInterval || FALLBACK_INTERVAL;

  const pageSize = preferences.logsPageSize;

  const loadLogs = useCallback(async () => {
    try {
      const data = await apiGet<{ logs: LogEntry[] }>(`/logs/?limit=${pageSize}`);
      setLogs(data.logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Fetch on mount, and again if the page size changes. The rule guards
  // against cascading renders from repeated setState; state here is only set
  // after the request resolves. Fetching server-side was rejected because it
  // would make `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadLogs(); }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = window.setInterval(() => {
      void loadLogs();
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, intervalSeconds, loadLogs]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const toggleLevel = (level: Level) => {
    setLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const categories = useMemo(
    () => Array.from(new Set(logs.map((l) => l.category))).filter(Boolean),
    [logs],
  );

  const filtered = logs.filter((log) => {
    if (levels.size > 0 && !levels.has(log.level as Level)) return false;
    if (category && log.category !== category) return false;

    if (!filter) return true;
    const needle = filter.toLowerCase();
    return (
      log.event.toLowerCase().includes(needle) ||
      log.category.toLowerCase().includes(needle)
    );
  });

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">System Logs</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Audit trail of activity across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={autoRefresh ? <Pause size={14} /> : <Play size={14} />}
            onClick={() =>
              update({
                logsRefreshInterval: autoRefresh ? 0 : FALLBACK_INTERVAL,
              })
            }
            aria-pressed={autoRefresh}
            className={autoRefresh ? 'border-accent text-accent' : undefined}
          >
            {autoRefresh ? `Auto ${intervalSeconds}s` : 'Auto-refresh'}
          </Button>
          <Button
            icon={<RefreshCw size={14} />}
            loading={refreshing}
            onClick={manualRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          Could not load logs: {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-raised">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface-sunken px-3.5 py-2 sm:max-w-sm">
            <Search size={14} className="shrink-0 text-ink-subtle" />
            <input
              type="text"
              placeholder="Filter logs…"
              aria-label="Filter logs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>

          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                aria-pressed={levels.has(level)}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                  levels.has(level)
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
            <button
              onClick={() => setCategory(null)}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors',
                category === null
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
              )}
            >
              All
            </button>
            {categories.map((name) => (
              <button
                key={name}
                onClick={() => setCategory(name)}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors',
                  category === name
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-12" count={6} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={logs.length === 0 ? 'No activity yet' : 'No matching logs'}
              message={
                logs.length === 0
                  ? 'Upload a file or send a chat message and events will appear here.'
                  : 'Try clearing the filters above.'
              }
            />
          ) : (
            <div data-testid="log-list">
              {filtered.map((log) => {
                const Icon = LEVEL_ICONS[log.level] ?? Info;
                return (
                  <div
                    key={log.id}
                    data-level={log.level}
                    className="flex items-center gap-3.5 border-b border-line/60 px-5 py-3.5 last:border-b-0"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info,
                      )}
                    >
                      <Icon size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {log.event}
                      </p>
                      <p className="text-[11px] text-ink-subtle">
                        {log.category} · {formatTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-subtle">
        Showing {filtered.length} of {logs.length} loaded events (limit{' '}
        {preferences.logsPageSize}, configurable in Settings).
      </p>
    </div>
  );
}
