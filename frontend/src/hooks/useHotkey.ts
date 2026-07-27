'use client';

import { useEffect } from 'react';

/**
 * Bind a Cmd/Ctrl + key shortcut.
 *
 * Uses `event.key` rather than `code` so it follows the user's layout, and
 * fires on the meta key on macOS / control elsewhere.
 */
export function useHotkey(key: string, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      event.preventDefault();
      handler();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, enabled]);
}
