'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import { workflowService } from '@/services/workflowService';
import type { Workflow } from '@/types/workflow';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Nothing sets state before the first await, so this is safe to call from an
  // effect (react-hooks/set-state-in-effect).
  const loadWorkflows = useCallback(async () => {
    try {
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadWorkflows(); }, [loadWorkflows]);

  const handleCreate = async () => {
    const name = window.prompt('Workflow name');
    if (!name?.trim()) return;

    setCreating(true);
    try {
      await workflowService.createWorkflow({
        name: name.trim(),
        description: 'Created from the workflows page',
        total_steps: 5,
      });
      await loadWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workflow');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Workflows
          </h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>
            Manage and monitor automated multi-step AI tasks.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: creating ? 'wait' : 'pointer',
            opacity: creating ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <Plus size={16} />
          {creating ? 'Creating...' : 'Create Workflow'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: 'rgba(244, 67, 54, 0.12)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#f44336', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {workflows.map((wf, i) => (
          <WorkflowCard key={wf.id} workflow={wf} index={i} />
        ))}
      </div>

      {!loading && workflows.length === 0 && !error && (
        <p style={{ color: '#555577', textAlign: 'center', marginTop: '48px' }}>
          No workflows yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
