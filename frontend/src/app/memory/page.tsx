'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Brain, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/providers/ToastProvider';
import MemoryCard from '@/components/memory/MemoryCard';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { createMemory, deleteMemory, getMemories } from '@/services/memoryService';
import type { MemoryEntry } from '@/types/workflow';

/** Mirrors CATEGORY_ICONS in backend/app/memory/workspace_memory.py. */
const CATEGORIES = [
  { value: 'User Preference', icon: '👤' },
  { value: 'Project Context', icon: '📁' },
  { value: 'Technical Note', icon: '🔧' },
  { value: 'Workflow Pattern', icon: '⚙️' },
  { value: 'Code Pattern', icon: '💻' },
  { value: 'General Knowledge', icon: '📚' },
];

const FIELD_CLASS =
  'w-full rounded-[var(--radius-control)] border border-line bg-surface-sunken px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent placeholder:text-ink-subtle';

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    category: CATEGORIES[0].value,
    content: '',
  });

  const [pendingDelete, setPendingDelete] = useState<MemoryEntry | null>(null);
  const { toast } = useToast();

  const loadMemories = useCallback(async () => {
    try {
      const data = await getMemories();
      setMemories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadMemories(); }, [loadMemories]);

  const categories = useMemo(
    () => Array.from(new Set(memories.map((m) => m.category))).filter(Boolean),
    [memories],
  );

  const visible = filter
    ? memories.filter((m) => m.category === filter)
    : memories;

  const handleCreate = async () => {
    if (!form.content.trim()) return;

    setCreating(true);
    try {
      const created = await createMemory({
        category: form.category,
        content: form.content.trim(),
        source: 'manual',
      });

      // The backend deduplicates identical content and returns the existing
      // row, so guard against inserting the same id twice.
      setMemories((current) =>
        current.some((m) => m.id === created.id)
          ? current
          : [created, ...current],
      );
      toast('Memory saved', 'success');
      setCreateOpen(false);
      setForm({ category: CATEGORIES[0].value, content: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save memory', 'error');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const snapshot = memories;
    setMemories((current) => current.filter((m) => m.id !== target.id));

    try {
      await deleteMemory(target.id);
      toast('Memory deleted', 'success');
    } catch (err) {
      setMemories(snapshot);
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Memory</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Facts the assistant has learned and recalls in future conversations.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={() => setCreateOpen(true)}
        >
          New Memory
        </Button>
      </div>

      {error && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {categories.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              filter === null
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
            )}
          >
            All ({memories.length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={cn(
                'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                filter === category
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {category} ({memories.filter((m) => m.category === category).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28" count={3} />
        </div>
      ) : visible.length > 0 ? (
        <div data-testid="memory-list" className="flex flex-col gap-4">
          {visible.map((entry, index) => (
            <MemoryCard
              key={entry.id}
              entry={entry}
              index={index}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Brain}
          title={memories.length === 0 ? 'No memories yet' : 'No matches'}
          message={
            memories.length === 0
              ? 'Tell the assistant something like “I prefer FastAPI for backends” in chat and it will be saved here automatically — or add one yourself.'
              : `Nothing stored under “${filter}”.`
          }
          action={
            memories.length === 0 ? (
              <Button
                variant="primary"
                icon={<Plus size={15} />}
                onClick={() => setCreateOpen(true)}
              >
                New Memory
              </Button>
            ) : undefined
          }
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New memory"
        description="Facts stored here are recalled automatically in future chats."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={!form.content.trim()}
              onClick={handleCreate}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="memory-category"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              Category
            </label>
            <select
              id="memory-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={FIELD_CLASS}
            >
              {CATEGORIES.map(({ value, icon }) => (
                <option key={value} value={value}>
                  {icon}  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="memory-content"
              className="mb-2 block text-sm font-medium text-ink-muted"
            >
              Content
            </label>
            <textarea
              id="memory-content"
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Deployments run on Render with a persistent disk at /data"
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete memory?"
        message={
          pendingDelete
            ? `“${pendingDelete.content}” will be forgotten and no longer used in chat.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
