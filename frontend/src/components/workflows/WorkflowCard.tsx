'use client';

import { Check, Minus, Pause, Play, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Workflow } from '@/types/workflow';

interface WorkflowCardProps {
  workflow: Workflow;
  index: number;
  busy?: boolean;
  onPause: (workflow: Workflow) => void;
  onResume: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onStepChange: (workflow: Workflow, stepsDone: number) => void;
}

const PROGRESS_COLOURS: Record<string, string> = {
  active: 'bg-accent',
  completed: 'bg-success',
  failed: 'bg-danger',
  paused: 'bg-warn',
};

export default function WorkflowCard({
  workflow,
  index,
  busy = false,
  onPause,
  onResume,
  onDelete,
  onStepChange,
}: WorkflowCardProps) {
  const { tone, label } = statusTone(workflow.status);
  const barColour = PROGRESS_COLOURS[workflow.status] ?? 'bg-accent';

  const canDecrement = workflow.steps_done > 0;
  const canIncrement = workflow.steps_done < workflow.steps_total;

  return (
    <Card interactive index={index} className="flex flex-col p-6">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="flex-1 text-base font-semibold text-ink">{workflow.name}</h3>
        <Badge
          tone={tone}
          icon={
            workflow.status === 'active' ? (
              <RefreshCw size={10} />
            ) : workflow.status === 'completed' ? (
              <Check size={10} />
            ) : workflow.status === 'failed' ? (
              <X size={10} />
            ) : (
              <Pause size={10} />
            )
          }
        >
          {label}
        </Badge>
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-ink-muted">
        {workflow.description || 'No description'}
      </p>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-ink-muted">Progress</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onStepChange(workflow, workflow.steps_done - 1)}
              disabled={!canDecrement || busy}
              aria-label="Decrease completed steps"
              className="cursor-pointer rounded p-0.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={13} />
            </button>
            <span className="text-xs tabular-nums text-ink-muted">
              {workflow.steps_done} / {workflow.steps_total} steps (
              {workflow.progress}%)
            </span>
            <button
              onClick={() => onStepChange(workflow, workflow.steps_done + 1)}
              disabled={!canIncrement || busy}
              aria-label="Increase completed steps"
              className="cursor-pointer rounded p-0.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} />
            </button>
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

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
        <span className="text-xs text-ink-subtle">
          {workflow.created_at
            ? new Date(workflow.created_at).toLocaleDateString()
            : '—'}
        </span>

        <div className="flex items-center gap-2">
          {/* This button previously had no onClick at all. */}
          {workflow.status === 'active' ? (
            <Button
              size="sm"
              icon={<Pause size={12} />}
              disabled={busy}
              onClick={() => onPause(workflow)}
            >
              Pause
            </Button>
          ) : workflow.status === 'paused' ? (
            <Button
              size="sm"
              icon={<Play size={12} />}
              disabled={busy}
              onClick={() => onResume(workflow)}
            >
              Resume
            </Button>
          ) : null}

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
