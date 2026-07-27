'use client';

import {
  AlertCircle,
  Check,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Workflow, WorkflowStep } from '@/types/workflow';
import WorkflowSteps from './WorkflowSteps';

interface WorkflowCardProps {
  workflow: Workflow;
  steps: WorkflowStep[];
  index: number;
  busy?: boolean;
  onRun: (workflow: Workflow) => void;
  onPause: (workflow: Workflow) => void;
  onResume: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onStepChange: (workflow: Workflow, stepsDone: number) => void;
}

const PROGRESS_COLOURS: Record<string, string> = {
  active: 'bg-accent',
  planning: 'bg-accent',
  running: 'bg-accent',
  completed: 'bg-success',
  failed: 'bg-danger',
  paused: 'bg-warn',
};

function StatusIcon({ status }: { status: Workflow['status'] }) {
  if (status === 'planning' || status === 'running')
    return <Loader2 size={10} className="animate-spin" />;
  if (status === 'completed') return <Check size={10} />;
  if (status === 'failed') return <X size={10} />;
  if (status === 'paused') return <Pause size={10} />;
  return <RefreshCw size={10} />;
}

export default function WorkflowCard({
  workflow,
  steps,
  index,
  busy = false,
  onRun,
  onPause,
  onResume,
  onDelete,
  onStepChange,
}: WorkflowCardProps) {
  const { tone, label } = statusTone(workflow.status);
  const barColour = PROGRESS_COLOURS[workflow.status] ?? 'bg-accent';

  const inFlight = workflow.status === 'planning' || workflow.status === 'running';
  const locked = busy || inFlight;

  // Manual step adjustment only makes sense for a workflow that is being
  // tracked by hand — while a run owns the counter, it would fight the runner.
  const manualStepsAllowed = !inFlight && steps.length === 0;

  return (
    <Card interactive index={index} className="flex flex-col p-6">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="flex-1 text-base font-semibold text-ink">{workflow.name}</h3>
        <Badge tone={tone} icon={<StatusIcon status={workflow.status} />}>
          {workflow.status === 'planning' ? 'Planning' : label}
        </Badge>
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted">
        {workflow.description || 'No description'}
      </p>

      {workflow.error && (
        <div className="mb-4 flex items-start gap-2 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft p-2.5">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-xs leading-relaxed text-danger">{workflow.error}</p>
        </div>
      )}

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-ink-muted">
            {workflow.status === 'planning' ? 'Planning steps…' : 'Progress'}
          </span>

          <div className="flex items-center gap-1.5">
            {manualStepsAllowed && (
              <button
                onClick={() => onStepChange(workflow, workflow.steps_done - 1)}
                disabled={workflow.steps_done === 0 || busy}
                aria-label="Decrease completed steps"
                className="cursor-pointer rounded p-0.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={13} />
              </button>
            )}

            <span className="text-xs tabular-nums text-ink-muted">
              {workflow.steps_done} / {workflow.steps_total} steps (
              {workflow.progress}%)
            </span>

            {manualStepsAllowed && (
              <button
                onClick={() => onStepChange(workflow, workflow.steps_done + 1)}
                disabled={workflow.steps_done >= workflow.steps_total || busy}
                aria-label="Increase completed steps"
                className="cursor-pointer rounded p-0.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={13} />
              </button>
            )}
          </div>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover"
          role="progressbar"
          aria-valuenow={workflow.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${workflow.name} progress`}
        >
          <div
            data-testid="progress-fill"
            className={`h-full rounded-full transition-[width] duration-500 ${barColour}`}
            style={{ width: `${workflow.progress}%` }}
          />
        </div>
      </div>

      <WorkflowSteps steps={steps} />

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
        <span className="text-xs text-ink-subtle">
          {workflow.created_at
            ? new Date(workflow.created_at).toLocaleDateString()
            : '—'}
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles size={12} />}
            disabled={locked}
            loading={inFlight}
            onClick={() => onRun(workflow)}
            aria-label={`Run ${workflow.name}`}
          >
            {inFlight
              ? workflow.status === 'planning'
                ? 'Planning'
                : 'Running'
              : workflow.status === 'active'
                ? 'Run'
                : 'Re-run'}
          </Button>

          {workflow.status === 'paused' ? (
            <Button
              size="sm"
              icon={<Play size={12} />}
              disabled={busy}
              onClick={() => onResume(workflow)}
            >
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              icon={<Pause size={12} />}
              disabled={busy || workflow.status === 'completed'}
              onClick={() => onPause(workflow)}
            >
              Pause
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            aria-label={`Delete ${workflow.name}`}
            disabled={busy}
            onClick={() => onDelete(workflow)}
            className="hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
