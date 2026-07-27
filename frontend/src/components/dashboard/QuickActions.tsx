'use client';

import Link from 'next/link';
import { Activity, GitBranch, MessageSquare, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

const ACTIONS: Array<{ label: string; icon: LucideIcon; href: string }> = [
  { label: 'New Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Upload File', icon: Upload, href: '/files' },
  { label: 'Create Workflow', icon: GitBranch, href: '/workflows' },
  { label: 'View Logs', icon: Activity, href: '/logs' },
];

export default function QuickActions() {
  return (
    <Card className="w-full p-6 lg:w-80 lg:shrink-0">
      <h3 className="text-lg font-semibold text-ink">Quick Actions</h3>
      <p className="mt-1 mb-5 text-[13px] text-ink-muted">
        Common tasks to get started
      </p>

      <div className="flex flex-col gap-2">
        {ACTIONS.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface-sunken px-4 py-3 text-sm text-ink-muted transition-colors hover:border-accent hover:text-ink"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
              <Icon size={15} className="text-accent" />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </Card>
  );
}
