'use client';

import { create } from 'zustand';
import { MOCK_WORKFLOWS } from '@/utils/constants';
import type { Workflow } from '@/types/workflow';

interface WorkflowStore {
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: MOCK_WORKFLOWS,
  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [workflow, ...state.workflows] })),
  updateWorkflow: (id, updates) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
}));
