'use client';

import { Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { MemoryEntry } from '@/types/workflow';

export default function MemoryCard({
  entry,
  index,
  onDelete,
}: {
  entry: MemoryEntry;
  index: number;
  onDelete: (entry: MemoryEntry) => void;
}) {
  return (
    <Card interactive index={index} className="group relative p-5 pr-12">
      <button
        onClick={() => onDelete(entry)}
        aria-label="Delete memory"
        title="Delete memory"
        className="absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 text-ink-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100"
      >
        <Trash2 size={15} />
      </button>

      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="text-xl" aria-hidden>
          {entry.icon}
        </span>
        <Badge tone="accent">{entry.category}</Badge>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-ink">{entry.content}</p>

      <div className="flex items-center justify-between text-xs text-ink-subtle">
        <span>Source: {entry.source || 'unknown'}</span>
        <span>
          {entry.created_at
            ? new Date(entry.created_at).toLocaleDateString()
            : ''}
        </span>
      </div>
    </Card>
  );
}
