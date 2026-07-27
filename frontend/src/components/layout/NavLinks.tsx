'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/lib/nav';

/** Nav list shared by the desktop sidebar and the mobile drawer. */
export default function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ id, label, icon: Icon, href }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5',
              'text-sm transition-colors duration-200',
              active
                ? 'bg-accent-soft font-medium text-accent'
                : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
            )}
          >
            <Icon size={18} className="shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
