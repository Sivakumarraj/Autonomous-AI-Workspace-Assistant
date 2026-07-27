/**
 * Single source of truth for the backend URL.
 *
 * NEXT_PUBLIC_* variables are inlined by Next at BUILD time, not read at
 * runtime — so this must be set as a build argument in Docker and as an
 * environment variable in the Vercel project settings.
 */

const RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Backend origin with any trailing slash removed. */
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

/** Build a full API URL from a leading-slash path, e.g. apiUrl('/files'). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
