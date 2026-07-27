'use client';

import { create } from 'zustand';
import { workflowService } from '@/services/workflowService';
import type { Workflow } from '@/types/workflow';

interface WorkflowStore {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
  fetchWorkflows: () => Promise<void>;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: number, updates: Partial<Workflow>) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  // Starts empty and is populated from the API. It used to be seeded with
  // MOCK_WORKFLOWS, so the UI showed four invented workflows on first load.
  workflows: [],
  loading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ loading: true });
    try {
      const workflows = await workflowService.getWorkflows();
      set({ workflows, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load workflows' });
    } finally {
      set({ loading: false });
    }
  },

  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [workflow, ...state.workflows] })),

  updateWorkflow: (id, updates) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
}));
