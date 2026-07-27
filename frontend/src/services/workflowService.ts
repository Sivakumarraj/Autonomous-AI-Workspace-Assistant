import { apiDelete, apiGet, apiPost, apiPut } from './api';
import type { Workflow, WorkflowCreate, WorkflowStep } from '@/types/workflow';

interface RunResponse {
  workflow: Workflow;
  message: string;
}

export const workflowService = {
  getWorkflows: () => apiGet<Workflow[]>('/workflows/'),
  getWorkflow: (id: number) => apiGet<Workflow>(`/workflows/${id}`),
  createWorkflow: (data: WorkflowCreate) => apiPost<Workflow>('/workflows/', data),
  updateWorkflow: (id: number, data: Partial<Workflow>) =>
    apiPut<Workflow>(`/workflows/${id}`, data),
  pauseWorkflow: (id: number) => apiPost<Workflow>(`/workflows/${id}/pause`, {}),
  resumeWorkflow: (id: number) => apiPost<Workflow>(`/workflows/${id}/resume`, {}),
  deleteWorkflow: (id: number) => apiDelete(`/workflows/${id}`),

  /** Start a run. Returns immediately; poll getSteps to follow progress. */
  runWorkflow: (id: number) => apiPost<RunResponse>(`/workflows/${id}/run`, {}),
  getSteps: (id: number) => apiGet<WorkflowStep[]>(`/workflows/${id}/steps`),
};

/** Statuses where the server is actively working and the UI should poll. */
export const IN_FLIGHT: ReadonlySet<string> = new Set(['planning', 'running']);
