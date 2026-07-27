'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'nexus-theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Runs before paint, inlined in <head>, so the stored theme is on <html>
 * before the first render. Without it the page flashes dark then switches.
 */
// Dark is the product's default look, so it is used unless the visitor has
// explicitly chosen light. OS preference is deliberately not consulted — the
// interface is designed dark-first and light is opt-in.
export const THEME_INIT_SCRIPT = `
(function(){try{
var t=localStorage.getItem('${STORAGE_KEY}');
document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

/*
 * The <html data-theme> attribute is the source of truth — the inline script
 * above sets it before React exists. useSyncExternalStore reads it directly,
 * which avoids the "setState synchronously in an effect" pattern that syncing
 * it into component state would require.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark';
}

/** Server and first client render agree on the documented default. */
function getServerSnapshot(): Theme {
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can block storage; the theme still applies for now.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getSnapshot() === 'light' ? 'dark' : 'light');
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
