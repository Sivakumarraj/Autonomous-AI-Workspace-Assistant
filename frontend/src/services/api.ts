import { apiUrl } from '@/lib/config';

/**
 * Thin fetch wrappers around the backend.
 *
 * Errors carry the backend's `detail` message where there is one, so the UI can
 * show "GEMINI_API_KEY is not configured" instead of a bare "500".
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText || `Request failed with ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Response had no JSON body; keep the status text.
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function apiGet<T>(endpoint: string): Promise<T> {
  return handle<T>(await fetch(apiUrl(endpoint), { cache: 'no-store' }));
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  return handle<T>(
    await fetch(apiUrl(endpoint), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  );
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<T> {
  return handle<T>(
    await fetch(apiUrl(endpoint), {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }),
  );
}

export async function apiDelete<T = void>(endpoint: string): Promise<T> {
  return handle<T>(await fetch(apiUrl(endpoint), { method: 'DELETE' }));
}

export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  // No Content-Type header: the browser must set the multipart boundary.
  return handle<T>(
    await fetch(apiUrl(endpoint), { method: 'POST', body: formData }),
  );
}
