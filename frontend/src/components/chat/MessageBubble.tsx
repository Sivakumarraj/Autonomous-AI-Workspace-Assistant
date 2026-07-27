'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import Badge from '@/components/ui/Badge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  chunks?: string[];
  isError?: boolean;
}

export default function MessageBubble({
  message,
  showSources,
}: {
  message: ChatMessage;
  showSources: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === 'user';
  const chunks = message.chunks ?? [];
  const hasSources = showSources && chunks.length > 0;

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'animate-fade-in max-w-[85%] rounded-[var(--radius-card)] px-4 py-3 sm:max-w-[75%]',
          isUser
            ? 'bg-accent text-white'
            : message.isError
              ? 'border border-danger/40 bg-danger-soft'
              : 'border border-line bg-surface-raised',
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-semibold',
              isUser ? 'text-white/80' : 'text-ink-muted',
            )}
          >
            {isUser ? 'You' : 'Assistant'}
          </span>

          {message.isError && <AlertCircle size={12} className="text-danger" />}

          {message.mode && message.mode !== 'general' && (
            <Badge tone={message.mode === 'rag' ? 'accent' : 'warn'}>
              via {message.mode}
            </Badge>
          )}
        </div>

        <p
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            isUser ? 'text-white' : message.isError ? 'text-danger' : 'text-ink',
          )}
        >
          {message.content}
        </p>

        {hasSources && (
          <div className="mt-2.5 border-t border-line pt-2.5">
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <FileText size={12} />
              {chunks.length} source{chunks.length === 1 ? '' : 's'}
              <ChevronDown
                size={12}
                className={cn('transition-transform', expanded && 'rotate-180')}
              />
            </button>

            {expanded && (
              <div className="mt-2 flex flex-col gap-2">
                {chunks.map((chunk, i) => (
                  <p
                    key={i}
                    className="border-l-2 border-accent/40 pl-2.5 text-xs leading-relaxed whitespace-pre-wrap text-ink-muted"
                  >
                    {chunk}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
