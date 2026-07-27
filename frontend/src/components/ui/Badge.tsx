import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'accent' | 'success' | 'warn' | 'danger' | 'neutral';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-hover text-ink-muted',
};

export default function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1',
        'text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Map a backend file/workflow status string to a badge tone + label. */
export function statusTone(status: string): { tone: Tone; label: string } {
  switch (status) {
    case 'ready':
    case 'completed':
      return { tone: 'success', label: status === 'ready' ? 'Ready' : 'Completed' };
    case 'active':
      return { tone: 'success', label: 'Active' };
    case 'paused':
      return { tone: 'warn', label: 'Paused' };
    case 'no_text':
      return { tone: 'warn', label: 'No text' };
    case 'pending_embedding':
      return { tone: 'warn', label: 'Not indexed' };
    case 'processing':
      return { tone: 'accent', label: 'Processing' };
    case 'failed':
    case 'error':
      return { tone: 'danger', label: status === 'failed' ? 'Failed' : 'Error' };
    default:
      return { tone: 'neutral', label: status };
  }
}
