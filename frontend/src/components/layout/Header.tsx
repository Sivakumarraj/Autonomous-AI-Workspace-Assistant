'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { apiGet } from '@/services/api';

interface HeaderProps {
  onOpenPalette: () => void;
  onOpenMenu: () => void;
}

// Platform never changes, so there is nothing to subscribe to. Reading it via
// useSyncExternalStore keeps the server render ("Ctrl") and the client render
// consistent without syncing it into state from an effect.
const noopSubscribe = () => () => {};
const getIsMac = () =>
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const getIsMacServer = () => false;

/**
 * Every control here used to be decorative — the search box, bell, and theme
 * toggle had no handlers at all. All three now do something real.
 */
export default function Header({ onOpenPalette, onOpenMenu }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [logsToday, setLogsToday] = useState<number | null>(null);
  const isMac = useSyncExternalStore(noopSubscribe, getIsMac, getIsMacServer);

  // The bell badge shows a real number instead of a static dot.
  const loadCount = useCallback(async () => {
    try {
      const stats = await apiGet<{ logs_today: number }>('/dashboard/stats');
      setLogsToday(stats.logs_today);
    } catch {
      setLogsToday(null);
    }
  }, []);

  // One-shot fetch on mount; state is only set after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadCount(); }, [loadCount]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface-sunken px-4 sm:px-6">
      <button
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="cursor-pointer rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink md:hidden"
      >
        <Menu size={19} />
      </button>

      {/* A button, not an input: it opens the palette, which owns the real field. */}
      <button
        onClick={onOpenPalette}
        aria-label="Search workspace"
        className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-2 text-left transition-colors hover:border-line-strong sm:max-w-md"
      >
        <Search size={15} className="shrink-0 text-ink-subtle" />
        <span className="flex-1 truncate text-sm text-ink-subtle">
          Search workspace…
        </span>
        <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-subtle sm:block">
          {isMac ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="cursor-pointer rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          href="/logs"
          aria-label={
            logsToday === null
              ? 'View logs'
              : `View logs, ${logsToday} events today`
          }
          title="Today's activity"
          className="relative cursor-pointer rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <Bell size={18} />
          {logsToday !== null && logsToday > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {logsToday > 99 ? '99+' : logsToday}
            </span>
          )}
        </Link>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#a855f7] text-xs font-semibold text-white">
          AI
        </span>
      </div>
    </header>
  );
}
