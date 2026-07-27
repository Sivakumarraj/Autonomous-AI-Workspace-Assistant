'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SidebarContent } from './Sidebar';

/**
 * Slide-in navigation for viewports below `md`, where the fixed 250px rail is
 * hidden. This file existed but was never imported, so the app had no mobile
 * navigation at all.
 */
export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-90 md:hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-slide-up absolute top-0 left-0 h-full w-[min(280px,85vw)] border-r border-line shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute top-5 right-3 z-10 cursor-pointer rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <X size={18} />
        </button>

        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
