import { apiDelete, apiGet, apiPost } from './api';
import type { MemoryEntry } from '@/types/workflow';

export async function getMemories(): Promise<MemoryEntry[]> {
  return apiGet<MemoryEntry[]>('/memory/');
}

export async function createMemory(data: {
  category: string;
  content: string;
  source?: string;
}): Promise<MemoryEntry> {
  return apiPost<MemoryEntry>('/memory/', data);
}

export async function deleteMemory(id: number): Promise<void> {
  await apiDelete(`/memory/${id}`);
}
