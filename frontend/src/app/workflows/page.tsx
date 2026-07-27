'use client';

import { useCallback, useEffect, useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { workflowService } from '@/services/workflowService';
import type { Workflow } from '@/types/workflow';

const FIELD_CLASS =
  'w-full rounded-[var(--radius-control)] border border-line bg-surface-sunken px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent placeholder:text-ink-subtle';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', total_steps: 5 });

  const [pendingDelete, setPendingDelete] = useState<Workflow | null>(null);
  const { toast } = useToast();

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

  /**
   * Apply a change optimistically, then reconcile with the server response.
   * On failure the previous list is restored so the UI never shows a state
   * the backend rejected.
   */
  const mutate = useCallback(
    async (
      workflow: Workflow,
      optimistic: Partial<Workflow>,
      request: () => Promise<Workflow>,
      successMessage: string,
    ) => {
      const snapshot = workflows;
      setBusyId(workflow.id);
      setWorkflows((current) =>
        current.map((w) => (w.id === workflow.id ? { ...w, ...optimistic } : w)),
      );

      try {
        const updated = await request();
        setWorkflows((current) =>
          current.map((w) => (w.id === updated.id ? updated : w)),
        );
        toast(successMessage, 'success');
      } catch (err) {
        setWorkflows(snapshot);
        toast(err instanceof Error ? err.message : 'Update failed', 'error');
      } finally {
        setBusyId(null);
      }
    },
    [workflows, toast],
  );

  const handlePause = (workflow: Workflow) =>
    mutate(
      workflow,
      { status: 'paused' },
      () => workflowService.pauseWorkflow(workflow.id),
      `“${workflow.name}” paused`,
    );

  const handleResume = (workflow: Workflow) =>
    mutate(
      workflow,
      { status: 'active' },
      () => workflowService.resumeWorkflow(workflow.id),
      `“${workflow.name}” resumed`,
    );

  const handleStepChange = (workflow: Workflow, stepsDone: number) => {
    const clamped = Math.max(0, Math.min(stepsDone, workflow.steps_total));
    const progress = workflow.steps_total
      ? Math.round((clamped / workflow.steps_total) * 100)
      : 0;

    return mutate(
      workflow,
      { steps_done: clamped, progress },
      () => workflowService.updateWorkflow(workflow.id, { steps_done: clamped }),
      `${clamped} of ${workflow.steps_total} steps complete`,
    );
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;

    setCreating(true);
    try {
      const created = await workflowService.createWorkflow({
        name: form.name.trim(),
        description: form.description.trim(),
        total_steps: form.total_steps,
      });
      setWorkflows((current) => [created, ...current]);
      toast(`“${created.name}” created`, 'success');
      setCreateOpen(false);
      setForm({ name: '', description: '', total_steps: 5 });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create workflow', 'error');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const snapshot = workflows;
    setWorkflows((current) => current.filter((w) => w.id !== target.id));

    try {
      await workflowService.deleteWorkflow(target.id);
      toast(`“${target.name}” deleted`, 'success');
    } catch (err) {
      setWorkflows(snapshot);
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Workflows</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Manage and monitor automated multi-step tasks.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={() => setCreateOpen(true)}
        >
          Create Workflow
        </Button>
      </div>

      {error && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonCards count={4} />
      ) : workflows.length > 0 ? (
        <div
          data-testid="workflow-grid"
          className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"
        >
          {workflows.map((workflow, i) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              index={i}
              busy={busyId === workflow.id}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={setPendingDelete}
              onStepChange={handleStepChange}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GitBranch}
          title="No workflows yet"
          message="Create a workflow to track a multi-step task and its progress."
          action={
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
            >
              Create Workflow
            </Button>
          }
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create workflow"
        description="Track a multi-step task and its progress."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={!form.name.trim()}
              onClick={handleCreate}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="workflow-name"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              Name
            </label>
            <input
              id="workflow-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && form.name.trim()) void handleCreate();
              }}
              placeholder="Document intelligence pipeline"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="workflow-description"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              Description
            </label>
            <textarea
              id="workflow-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this workflow does"
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>

          <div>
            <label
              htmlFor="workflow-steps"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              Total steps
            </label>
            <input
              id="workflow-steps"
              type="number"
              min={1}
              max={100}
              value={form.total_steps}
              onChange={(e) =>
                setForm({
                  ...form,
                  total_steps: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete workflow?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
