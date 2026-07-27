'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nexus-preferences';

export interface Preferences {
  /** Seconds between automatic log refreshes. 0 disables it. */
  logsRefreshInterval: number;
  /** Rows requested from GET /logs/ (the endpoint allows 1–500). */
  logsPageSize: number;
  /** Show retrieved source chunks under RAG chat replies by default. */
  showChatSources: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  logsRefreshInterval: 0,
  logsPageSize: 50,
  showChatSources: true,
};

/*
 * localStorage is the source of truth, read through useSyncExternalStore.
 * Keeping a mirrored copy in component state would mean setting state inside
 * an effect on mount, which cascades renders.
 *
 * getSnapshot must return a referentially stable value or React re-renders
 * forever, so the parsed object is cached and only rebuilt when the raw
 * string actually changes.
 */
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedValue: Preferences = DEFAULT_PREFERENCES;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function getSnapshot(): Preferences {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedValue;
  }

  if (raw === cachedRaw) return cachedValue;

  cachedRaw = raw;
  if (!raw) {
    cachedValue = DEFAULT_PREFERENCES;
    return cachedValue;
  }

  try {
    // Spread over the defaults so a preference added in a later release is
    // never undefined for an existing user.
    cachedValue = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    cachedValue = DEFAULT_PREFERENCES;
  }
  return cachedValue;
}

function getServerSnapshot(): Preferences {
  return DEFAULT_PREFERENCES;
}

function emit() {
  listeners.forEach((listener) => listener());
}

/** Preferences persisted to localStorage and shared across open tabs. */
export function usePreferences() {
  const preferences = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const update = useCallback((patch: Partial<Preferences>) => {
    const next = { ...getSnapshot(), ...patch };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable; hold the value in the cache for this session.
      cachedRaw = null;
      cachedValue = next;
    }
    emit();
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      cachedRaw = null;
      cachedValue = DEFAULT_PREFERENCES;
    }
    emit();
  }, []);

  return { preferences, update, reset };
}
