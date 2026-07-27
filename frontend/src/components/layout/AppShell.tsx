'use client';

import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useHotkey } from '@/hooks/useHotkey';
import CommandPalette from '@/components/ui/CommandPalette';
import Header from './Header';
import MobileMenu from './MobileMenu';
import Sidebar from './Sidebar';

/**
 * Client shell around every page. Owns the palette and drawer state so the
 * root layout can stay a server component.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useHotkey('k', openPalette);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Offset matches the fixed rail width, and only applies at md and up. */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col md:ml-[250px]">
        <Header onOpenPalette={openPalette} onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
