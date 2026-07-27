'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import FileCard from '@/components/files/FileCard';
import FileUpload, { UploadButton } from '@/components/files/FileUpload';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { fileService } from '@/services/fileService';
import type { FileItem } from '@/types/file';

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<FileItem | null>(null);
  const { toast } = useToast();

  const loadFiles = useCallback(async () => {
    try {
      const data = await fileService.getFiles();
      setFiles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadFiles(); }, [loadFiles]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    // Optimistic: drop it immediately, restore if the request fails.
    setFiles((current) => current.filter((f) => f.id !== target.id));

    try {
      await fileService.deleteFile(target.id);
      toast(`${target.filename} deleted`, 'success');
      await loadFiles();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
      await loadFiles();
    }
  };

  const filtered = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">File Manager</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Upload documents to make them searchable by the assistant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex w-56 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-2">
            <Search size={14} className="shrink-0 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search files…"
              aria-label="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <UploadButton onUploaded={loadFiles} />
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mb-6">
        <FileUpload onUploaded={loadFiles} />
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : filtered.length > 0 ? (
        <div
          data-testid="file-grid"
          className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4"
        >
          {filtered.map((file, i) => (
            <FileCard
              key={file.id}
              file={file}
              index={i}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={files.length === 0 ? 'No files yet' : 'No matches'}
          message={
            files.length === 0
              ? 'Drop a PDF, TXT, or Markdown file above. It will be chunked, embedded, and made searchable in chat.'
              : `Nothing matches “${searchQuery}”.`
          }
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete file?"
        message={
          pendingDelete
            ? `“${pendingDelete.filename}” and its ${pendingDelete.chunk_count} indexed chunks will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
