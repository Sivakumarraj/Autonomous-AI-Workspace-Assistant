'use client';

import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  user: { name: string; avatar: string } | null;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: true,
  user: { name: 'AI User', avatar: 'AI' },
  login: () => set({ isAuthenticated: true, user: { name: 'AI User', avatar: 'AI' } }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
