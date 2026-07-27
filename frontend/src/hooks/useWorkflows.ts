'use client';

import { useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';

export function useWorkflows() {
  const store = useWorkflowStore();
  const { fetchWorkflows } = store;

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows: store.workflows,
    loading: store.loading,
    error: store.error,
    refresh: store.fetchWorkflows,
    addWorkflow: store.addWorkflow,
    updateWorkflow: store.updateWorkflow,
  };
}
