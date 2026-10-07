'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type SidebarContextValue = {
  isOpen: boolean;
  /** False until the client has applied the viewport + stored preference. */
  ready: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = 'reviewflow-sidebar-open';
const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * One sidebar for every breakpoint. On desktop it pushes content aside and
 * remembers whether you collapsed it; on mobile it is a transient overlay
 * that always starts closed and is never persisted (otherwise closing it on
 * a phone would leave it collapsed the next time you open the desktop app).
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  // SSR default is "open" (desktop-first). `ready` lets the drawer render a
  // mobile-closed state before hydration so the overlay never flashes open.
  const [isOpen, setIsOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      setIsOpen(false);
    } else {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'true' || stored === 'false') {
          setIsOpen(stored === 'true');
        }
      } catch {
        // Ignore - falls back to the open-by-default state.
      }
    }
    setReady(true);
  }, []);

  const persist = (next: boolean) => {
    setIsOpen(next);
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Ignore (private browsing / storage disabled).
    }
  };

  const value: SidebarContextValue = {
    isOpen,
    ready,
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
