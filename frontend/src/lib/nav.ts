import {
  Activity,
  Brain,
  FileText,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

/** Single source of navigation, shared by the sidebar, drawer, and palette. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, href: '/chat' },
  { id: 'files', label: 'File Manager', icon: FileText, href: '/files' },
  { id: 'memory', label: 'Memory', icon: Brain, href: '/memory' },
  { id: 'workflows', label: 'Workflows', icon: GitBranch, href: '/workflows' },
  { id: 'logs', label: 'Logs', icon: Activity, href: '/logs' },
];

export const SETTINGS_ITEM: NavItem = {
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  href: '/settings',
};
