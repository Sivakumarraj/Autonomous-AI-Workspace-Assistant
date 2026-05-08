import { apiGet, apiPost, apiPut } from './api';
import type { Workflow } from '@/types/workflow';

export const workflowService = {
  getWorkflows: () => apiGet<Workflow[]>('/workflows'),
  createWorkflow: (data: Partial<Workflow>) => apiPost<Workflow>('/workflows', data),
  updateWorkflow: (id: string, data: Partial<Workflow>) => apiPut<Workflow>(`/workflows/${id}`, data),
  pauseWorkflow: (id: string) => apiPost<Workflow>(`/workflows/${id}/pause`, {}),
  resumeWorkflow: (id: string) => apiPost<Workflow>(`/workflows/${id}/resume`, {}),
};
