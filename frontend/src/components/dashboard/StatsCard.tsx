'use client';

import {
  Activity,
  FileCheck,
  Files,
  GitBranch,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

/**
 * Keys match what the dashboard passes. They previously did not — the map was
 * keyed by lucide component names ("ClipboardList", "Files") while the page
 * passed semantic names ("workflow", "file"), so every tile silently fell back
 * to the same clipboard icon.
 */
const ICONS: Record<string, LucideIcon> = {
  workflow: GitBranch,
  file: Files,
  memory: Sparkles,
  chat: MessageSquare,
  log: Activity,
  check: FileCheck,
};

export default function StatsCard({
  label,
  value,
  description,
  icon,
  index,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
  index: number;
}) {
  const Icon = ICONS[icon] ?? Activity;

  return (
    <Card interactive index={index} className="relative overflow-hidden p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <Icon size={17} className="shrink-0 text-accent" />
      </div>

      <p className="mb-1.5 text-4xl font-bold tabular-nums text-ink">{value}</p>
      <p className="text-xs leading-relaxed text-ink-subtle">{description}</p>
    </Card>
  );
}
