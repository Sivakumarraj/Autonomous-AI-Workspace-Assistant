'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Upload, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/providers/ToastProvider';
import Button from '@/components/ui/Button';
import { fileService } from '@/services/fileService';

const ACCEPTED = ['.pdf', '.txt', '.md'];

interface QueueItem {
  id: string;
  name: string;
  percent: number;
  state: 'uploading' | 'done' | 'error';
  detail?: string;
}

export default function FileUpload({
  onUploaded,
}: {
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  // Nested dragenter/dragleave events fire for every child element, so a plain
  // boolean flickers. Counting entries against leaves is the reliable fix.
  const dragDepth = useRef(0);
  const { toast } = useToast();

  const patch = useCallback((id: string, changes: Partial<QueueItem>) => {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }, []);

  const uploadAll = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const items: QueueItem[] = files.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        percent: 0,
        state: 'uploading',
      }));
      setQueue((current) => [...current, ...items]);

      // Sequential, not parallel: each upload triggers embedding work on the
      // server, and firing them all at once just queues them behind each other
      // while making the progress bars misleading.
      for (const [index, file] of files.entries()) {
        const item = items[index];
        try {
          const result = await fileService.uploadWithProgress(file, (percent) =>
            patch(item.id, { percent }),
          );

          patch(item.id, {
            percent: 100,
            state: result.warning ? 'error' : 'done',
            detail: result.warning ?? `${result.chunks_count} chunks indexed`,
          });

          if (result.warning) {
            toast(`${file.name}: ${result.warning}`, 'warning');
          } else {
            toast(
              `${file.name} uploaded — ${result.chunks_count} chunks indexed`,
              'success',
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Upload failed';
          patch(item.id, { state: 'error', detail: message });
          toast(`${file.name}: ${message}`, 'error');
        }
      }

      onUploaded();

      // Clear finished rows after a beat so the results stay readable first.
      window.setTimeout(() => {
        setQueue((current) =>
          current.filter((row) => !items.some((i) => i.id === row.id)),
        );
      }, 6000);
    },
    [patch, toast, onUploaded],
  );

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void uploadAll(Array.from(event.dataTransfer.files));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPTED.join(',')}
        onChange={(e) => {
          void uploadAll(Array.from(e.target.files ?? []));
          // Reset so re-picking the same file fires change again.
          if (inputRef.current) inputRef.current.value = '';
        }}
      />

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload files by dropping them here or clicking to browse"
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)]',
          'border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging
            ? 'border-accent bg-accent-soft'
            : 'border-line bg-surface-raised hover:border-line-strong',
        )}
      >
        <Upload
          size={22}
          className={dragging ? 'text-accent' : 'text-ink-subtle'}
        />
        <p className="text-sm text-ink">
          {dragging ? 'Drop to upload' : 'Drop files here, or click to browse'}
        </p>
        <p className="text-xs text-ink-subtle">
          {ACCEPTED.join(', ')} · up to 50 MB each
        </p>
      </div>

      {queue.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-control)] border border-line bg-surface-raised p-3"
            >
              <div className="flex items-center gap-2.5">
                {item.state === 'done' && (
                  <CheckCircle2 size={15} className="shrink-0 text-success" />
                )}
                {item.state === 'error' && (
                  <XCircle size={15} className="shrink-0 text-danger" />
                )}
                {item.state === 'uploading' && (
                  <AlertTriangle size={15} className="shrink-0 text-accent" />
                )}

                <span className="flex-1 truncate text-sm text-ink">
                  {item.name}
                </span>
                <span className="shrink-0 text-xs text-ink-subtle">
                  {item.state === 'uploading' ? `${item.percent}%` : ''}
                </span>
              </div>

              {item.state === 'uploading' && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-200"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              )}

              {item.detail && (
                <p
                  className={cn(
                    'mt-1.5 text-xs',
                    item.state === 'error' ? 'text-warn' : 'text-ink-subtle',
                  )}
                >
                  {item.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact button for headers; opens the same picker. */
export function UploadButton({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
        const result = await fileService.uploadWithProgress(file);
        toast(
          result.warning
            ? `${file.name}: ${result.warning}`
            : `${file.name} uploaded — ${result.chunks_count} chunks indexed`,
          result.warning ? 'warning' : 'success',
        );
      }
      onUploaded();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Upload failed', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPTED.join(',')}
        onChange={(e) => void handleFiles(Array.from(e.target.files ?? []))}
      />
      <Button
        variant="primary"
        loading={busy}
        icon={<Upload size={15} />}
        onClick={() => inputRef.current?.click()}
      >
        Upload
      </Button>
    </>
  );
}
