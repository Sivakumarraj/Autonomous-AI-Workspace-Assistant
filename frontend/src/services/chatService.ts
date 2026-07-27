import { apiPost } from './api';

export interface ChatResponse {
  response: string;
  retrieved_chunks: string[];
  mode: 'general' | 'rag' | 'workflow';
  memory_saved?: string | null;
}

export async function sendMessage(message: string): Promise<ChatResponse> {
  return apiPost<ChatResponse>('/chat', { message });
}
