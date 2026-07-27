'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM } from '@/lib/nav';
import NavLinks from './NavLinks';

/** Sidebar body, reused by the fixed desktop rail and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 border-b border-line px-5 py-5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-[#a855f7]">
          <Zap size={17} className="text-white" />
        </span>
        <span className="text-base font-semibold text-ink">Nexus AI</span>
        <span
          className="ml-1 h-2 w-2 rounded-full bg-success"
          title="Workspace online"
        />
      </Link>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-subtle uppercase">
          Workspace
        </p>
        <NavLinks items={NAV_ITEMS} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-line px-3 py-3">
        <NavLinks items={[SETTINGS_ITEM]} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/** Fixed rail, hidden below `md` where the drawer takes over. */
export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 z-50 hidden h-screen w-[250px] border-r border-line md:block">
      <SidebarContent />
    </aside>
  );
}
