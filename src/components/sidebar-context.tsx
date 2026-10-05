'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type SidebarContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = 'reviewflow-sidebar-open';

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Defaults to open on first load (including SSR) per spec. Any stored
  // preference from a previous session is applied after mount.
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'true' || stored === 'false') {
        setIsOpen(stored === 'true');
      }
    } catch {
      // Ignore — falls back to the open-by-default state.
    }
  }, []);

  const persist = (next: boolean) => {
    setIsOpen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Ignore (private browsing / storage disabled) — state just won't
      // persist across reloads.
    }
  };

  const value: SidebarContextValue = {
    isOpen,
    open: () => persist(true),
    close: () => persist(false),
    toggle: () => persist(!isOpen),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
