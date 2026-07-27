import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-surface-hover p-4">
          <Icon size={28} className="text-ink-subtle" />
        </div>
      )}
      <p className="text-base font-medium text-ink">{title}</p>
      {message && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          {message}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
