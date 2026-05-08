'use client';

import { useWorkflowStore } from '@/store/workflowStore';

export function useWorkflows() {
  const store = useWorkflowStore();
  return {
    workflows: store.workflows,
    addWorkflow: store.addWorkflow,
    updateWorkflow: store.updateWorkflow,
  };
}
