import { apiGet } from './api';

/**
 * Server configuration as reported by GET /settings.
 *
 * Note there is no API key field and never should be — the backend returns
 * `gemini_configured` as a boolean only.
 */
export interface ServerSettings {
  app_name: string;
  version: string;
  debug: boolean;

  gemini_configured: boolean;
  gemini_model: string;
  embedding_model: string;
  llm_temperature: number;

  chunk_size: number;
  chunk_overlap: number;
  retrieval_top_k: number;

  max_upload_size: number;
  allowed_extensions: string[];

  terminal_tool_enabled: boolean;
  browser_tool_enabled: boolean;

  allowed_origins: string[];
}

export function getServerSettings(): Promise<ServerSettings> {
  return apiGet<ServerSettings>('/settings');
}
