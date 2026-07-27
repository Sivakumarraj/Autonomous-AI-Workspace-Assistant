import { apiDelete, apiGet, apiPost, apiPut } from './api';
import type { Workflow, WorkflowCreate } from '@/types/workflow';

export const workflowService = {
  getWorkflows: () => apiGet<Workflow[]>('/workflows/'),
  createWorkflow: (data: WorkflowCreate) => apiPost<Workflow>('/workflows/', data),
  updateWorkflow: (id: number, data: Partial<Workflow>) =>
    apiPut<Workflow>(`/workflows/${id}`, data),
  pauseWorkflow: (id: number) => apiPost<Workflow>(`/workflows/${id}/pause`, {}),
  resumeWorkflow: (id: number) => apiPost<Workflow>(`/workflows/${id}/resume`, {}),
  deleteWorkflow: (id: number) => apiDelete(`/workflows/${id}`),
};
