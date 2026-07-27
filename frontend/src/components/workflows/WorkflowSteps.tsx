'use client';

import { useState } from 'react';
import { AlertCircle, Check, ChevronDown, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { WorkflowStep } from '@/types/workflow';

/** Human-readable label for each catalog action. */
const ACTION_LABELS: Record<string, string> = {
  list_documents: 'List documents',
  search_documents: 'Search documents',
  answer_question: 'Answer question',
  summarize_documents: 'Summarise documents',
  extract_facts: 'Extract facts to memory',
  recall_memory: 'Recall memory',
  save_memory: 'Save to memory',
  write_note: 'Write note',
};

function StepIcon({ status }: { status: WorkflowStep['status'] }) {
  if (status === 'completed') return <Check size={12} className="text-success" />;
  if (status === 'failed') return <AlertCircle size={12} className="text-danger" />;
  if (status === 'running')
    return <Loader2 size={12} className="animate-spin text-accent" />;
  return <Circle size={10} className="text-ink-subtle" />;
}

export default function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (steps.length === 0) return null;

  return (
    <div
      data-testid="workflow-steps"
      className="mt-4 flex flex-col gap-1 border-t border-line pt-4"
    >
      {steps.map((step) => {
        const isOpen = expanded === step.id;
        const body = step.error || step.output;
        const canExpand = Boolean(body);

        return (
          <div key={step.id}>
            <button
              onClick={() => canExpand && setExpanded(isOpen ? null : step.id)}
              disabled={!canExpand}
              aria-expanded={isOpen}
              data-step-status={step.status}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors',
                canExpand
                  ? 'cursor-pointer hover:bg-surface-hover'
                  : 'cursor-default',
              )}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <StepIcon status={step.status} />
              </span>

              <span
                className={cn(
                  'flex-1 truncate text-xs',
                  step.status === 'pending' ? 'text-ink-subtle' : 'text-ink',
                )}
                title={step.title}
              >
                {step.title}
              </span>

              <span className="shrink-0 text-[10px] text-ink-subtle">
                {ACTION_LABELS[step.action] ?? step.action}
              </span>

              {canExpand && (
                <ChevronDown
                  size={12}
                  className={cn(
                    'shrink-0 text-ink-subtle transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              )}
            </button>

            {isOpen && (
              <pre
                className={cn(
                  'mt-1 mb-2 ml-7 max-h-56 overflow-y-auto rounded-lg border p-3',
                  'text-[11px] leading-relaxed whitespace-pre-wrap',
                  step.error
                    ? 'border-danger/30 bg-danger-soft text-danger'
                    : 'border-line bg-surface-sunken text-ink-muted',
                )}
              >
                {body}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
