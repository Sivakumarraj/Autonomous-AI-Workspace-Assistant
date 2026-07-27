'use client';

import {
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge, { statusTone } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { FileItem } from '@/types/file';

const FILE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  md: FileText,
  txt: FileIcon,
  csv: FileSpreadsheet,
};

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function FileCard({
  file,
  index,
  onDelete,
}: {
  file: FileItem;
  index: number;
  onDelete: (file: FileItem) => void;
}) {
  const extension = file.filename.split('.').pop()?.toLowerCase() ?? 'txt';
  const Icon = FILE_ICONS[extension] ?? FileIcon;
  const { tone, label } = statusTone(file.status);

  return (
    <Card interactive index={index} className="group relative flex flex-col p-5">
      <button
        onClick={() => onDelete(file)}
        aria-label={`Delete ${file.filename}`}
        title="Delete file"
        className="absolute top-3 right-3 cursor-pointer rounded-lg p-1.5 text-ink-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100"
      >
        <Trash2 size={15} />
      </button>

      <div className="flex flex-col items-center pt-3 pb-4">
        <Icon size={44} strokeWidth={1.2} className="mb-3 text-ink-muted" />
        <p
          className="w-full truncate text-center text-sm font-medium text-ink"
          title={file.filename}
        >
          {file.filename}
        </p>
        <p className="mt-1 text-xs text-ink-subtle">
          {formatSize(file.size_bytes)}
          {file.chunk_count > 0 && ` · ${file.chunk_count} chunks`}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-xs text-ink-subtle">
          {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : ''}
        </span>
      </div>
    </Card>
  );
}
