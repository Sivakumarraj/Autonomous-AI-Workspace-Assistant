'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { IN_FLIGHT, workflowService } from '@/services/workflowService';
import type { Workflow, WorkflowStep } from '@/types/workflow';

const FIELD_CLASS =
  'w-full rounded-[var(--radius-control)] border border-line bg-surface-sunken px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent placeholder:text-ink-subtle';

/** How often to re-check a workflow that is planning or running. */
const POLL_MS = 2000;

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stepsById, setStepsById] = useState<Record<number, WorkflowStep[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const [pendingDelete, setPendingDelete] = useState<Workflow | null>(null);
  const { toast } = useToast();

  // Lets the poller announce completion without re-subscribing on every tick.
  const previousStatuses = useRef<Record<number, string>>({});

  const loadWorkflows = useCallback(async () => {
    try {
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
      setError(null);

      // Fetch steps for anything that has been planned, so re-visiting the
      // page still shows the last run's results.
      const withSteps = data.filter((w) => w.steps_total > 0);
      const results = await Promise.all(
        withSteps.map(async (w) => {
          try {
            return [w.id, await workflowService.getSteps(w.id)] as const;
          } catch {
            return [w.id, []] as const;
          }
        }),
      );
      setStepsById(Object.fromEntries(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount; state is only set after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadWorkflows(); }, [loadWorkflows]);

  const running = useMemo(
    () => workflows.filter((w) => IN_FLIGHT.has(w.status)),
    [workflows],
  );

  // Poll only while something is actually in flight, and stop as soon as it
  // settles — no background traffic on an idle page.
  useEffect(() => {
    if (running.length === 0) return;

    const timer = window.setInterval(async () => {
      const updated = await Promise.all(
        running.map(async (w) => {
          try {
            const [workflow, steps] = await Promise.all([
              workflowService.getWorkflow(w.id),
              workflowService.getSteps(w.id),
            ]);
            return { workflow, steps };
          } catch {
            return null;
          }
        }),
      );

      for (const entry of updated) {
        if (!entry) continue;
        const { workflow, steps } = entry;

        setWorkflows((current) =>
          current.map((w) => (w.id === workflow.id ? workflow : w)),
        );
        setStepsById((current) => ({ ...current, [workflow.id]: steps }));

        const previous = previousStatuses.current[workflow.id];
        if (previous !== workflow.status && !IN_FLIGHT.has(workflow.status)) {
          if (workflow.status === 'completed') {
            toast(`“${workflow.name}” completed`, 'success');
          } else if (workflow.status === 'failed') {
            toast(`“${workflow.name}” failed: ${workflow.error}`, 'error');
          }
        }
        previousStatuses.current[workflow.id] = workflow.status;
      }
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [running, toast]);

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

  const handleRun = async (workflow: Workflow) => {
    setBusyId(workflow.id);
    try {
      const { workflow: started } = await workflowService.runWorkflow(workflow.id);
      setWorkflows((current) =>
        current.map((w) => (w.id === started.id ? started : w)),
      );
      previousStatuses.current[workflow.id] = started.status;
      toast(`“${workflow.name}” started — planning steps`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start run', 'error');
    } finally {
      setBusyId(null);
    }
  };

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
        total_steps: 0,
      });
      setWorkflows((current) => [created, ...current]);
      toast(`“${created.name}” created — press Run to execute it`, 'success');
      setCreateOpen(false);
      setForm({ name: '', description: '' });
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
          <p className="mt-1.5 max-w-2xl text-[15px] text-ink-muted">
            Describe what you want done. The assistant plans the steps, runs them
            against your documents and memory, and reports back.
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
          className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4"
        >
          {workflows.map((workflow, i) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              steps={stepsById[workflow.id] ?? []}
              index={i}
              busy={busyId === workflow.id}
              onRun={handleRun}
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
          message="Create one and press Run. Try “Summarise my documents and save the key facts to memory”."
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
        description="Describe the outcome you want. The steps are planned for you when you run it."
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
              placeholder="Resume skills report"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label
              htmlFor="workflow-description"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              What should it do?
            </label>
            <textarea
              id="workflow-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Read my uploaded documents, extract the key technical facts into memory, and write a short summary."
              className={`${FIELD_CLASS} resize-none`}
            />
            <p className="mt-2 text-xs text-ink-subtle">
              Steps are planned from this description and run against your
              documents and memory. No shell or browser access.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete workflow?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” and its step history will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
