'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Brain,
  CornerDownLeft,
  FileText,
  GitBranch,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, SETTINGS_ITEM } from '@/lib/nav';
import { apiGet } from '@/services/api';
import type { FileItem } from '@/types/file';
import type { LogEntry, MemoryEntry, Workflow } from '@/types/workflow';

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Subsequence match: "wfl" matches "workflows". Returns a score where lower is
 * better (earlier and tighter matches rank first), or null for no match.
 */
function fuzzyScore(text: string, query: string): number | null {
  if (!query) return 0;

  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();

  const direct = haystack.indexOf(needle);
  if (direct !== -1) return direct; // contiguous matches always win

  let index = 0;
  let score = 0;
  let previous = -1;

  for (const char of needle) {
    const found = haystack.indexOf(char, index);
    if (found === -1) return null;
    // Penalise gaps so tightly-clustered matches rank higher.
    score += previous === -1 ? found : found - previous;
    previous = found;
    index = found + 1;
  }

  return score + 100; // always rank below a contiguous match
}

function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Only rendered while open, so query/selection state resets on mount rather
 * than needing effects that call setState during render.
 */
export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <Palette onClose={onClose} />;
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [records, setRecords] = useState<Command[]>([]);
  // Starts true: loading begins immediately on mount, so there is no need to
  // flip it on inside the effect.
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const navCommands = useMemo<Command[]>(
    () =>
      [...NAV_ITEMS, SETTINGS_ITEM].map((item) => ({
        id: `nav-${item.id}`,
        label: item.label,
        group: 'Navigate',
        icon: item.icon,
        href: item.href,
      })),
    [],
  );

  // Load searchable records when the palette opens. Aggregated client-side
  // from the existing list endpoints — the data volumes are small and this
  // avoids adding a backend search route.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const results = await Promise.allSettled([
        apiGet<FileItem[]>('/files'),
        apiGet<MemoryEntry[]>('/memory/'),
        apiGet<Workflow[]>('/workflows/'),
        apiGet<{ logs: LogEntry[] }>('/logs/?limit=100'),
      ]);
      if (cancelled) return;

      const collected: Command[] = [];

      if (results[0].status === 'fulfilled') {
        for (const file of results[0].value) {
          collected.push({
            id: `file-${file.id}`,
            label: file.filename,
            hint: `${file.chunk_count} chunks`,
            group: 'Files',
            icon: FileText,
            href: '/files',
          });
        }
      }
      if (results[1].status === 'fulfilled') {
        for (const memory of results[1].value) {
          collected.push({
            id: `memory-${memory.id}`,
            label: truncate(memory.content),
            hint: memory.category,
            group: 'Memory',
            icon: Brain,
            href: '/memory',
          });
        }
      }
      if (results[2].status === 'fulfilled') {
        for (const workflow of results[2].value) {
          collected.push({
            id: `workflow-${workflow.id}`,
            label: workflow.name,
            hint: workflow.status,
            group: 'Workflows',
            icon: GitBranch,
            href: '/workflows',
          });
        }
      }
      if (results[3].status === 'fulfilled') {
        for (const log of results[3].value.logs) {
          collected.push({
            id: `log-${log.id}`,
            label: truncate(log.event),
            hint: log.category,
            group: 'Logs',
            icon: Activity,
            href: '/logs',
          });
        }
      }

      setRecords(collected);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const all = [...navCommands, ...records];

    if (!query.trim()) {
      return all.slice(0, 12);
    }

    return all
      .map((command) => {
        const score = fuzzyScore(`${command.label} ${command.hint ?? ''}`, query.trim());
        return score === null ? null : { command, score };
      })
      .filter((entry): entry is { command: Command; score: number } => entry !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
      .map((entry) => entry.command);
  }, [navCommands, records, query]);

  // Selection resets in the input's onChange rather than an effect, so no
  // setState happens during render.
  const onQueryChange = (value: string) => {
    setQuery(value);
    setActive(0);
  };

  const select = useCallback(
    (command: Command | undefined) => {
      if (!command) return;
      onClose();
      router.push(command.href);
    },
    [onClose, router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (matches.length ? (i + 1) % matches.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (matches.length ? (i - 1 + matches.length) % matches.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(matches[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  // Keep the highlighted row in view during keyboard navigation.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // Precomputed rather than tracked with a variable mutated inside .map(),
  // which reassigns after render completes (react-hooks/immutability).
  const rows = matches.map((command, index) => ({
    command,
    index,
    showGroup: index === 0 || matches[index - 1].group !== command.group,
  }));

  return (
    <div
      className="fixed inset-0 z-150 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="animate-slide-up w-full max-w-xl overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-raised shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={17} className="shrink-0 text-ink-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search files, memories, workflows, logs…"
            aria-label="Search workspace"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-subtle sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[45vh] overflow-y-auto p-2">
          {loading && matches.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-subtle">Loading…</p>
          )}

          {!loading && matches.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-subtle">
              No results for “{query}”
            </p>
          )}

          {rows.map(({ command, index, showGroup }) => {
            const Icon = command.icon;

            return (
              <div key={command.id}>
                {showGroup && (
                  <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-ink-subtle uppercase">
                    {command.group}
                  </p>
                )}
                <button
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(command)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left',
                    index === active ? 'bg-accent-soft text-ink' : 'text-ink-muted',
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate text-sm">{command.label}</span>
                  {command.hint && (
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {command.hint}
                    </span>
                  )}
                  {index === active && (
                    <CornerDownLeft size={13} className="shrink-0 text-ink-subtle" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
