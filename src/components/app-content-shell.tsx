'use client';

import type { ReactNode } from 'react';
import { useSidebar } from '@/components/sidebar-context';

/**
 * Wraps the header + main content column so its left margin can react to
 * sidebar open/close state on desktop (lg+). On small screens the sidebar
 * is an overlay instead, so no margin shift happens there regardless of
 * state.
 */
export function AppContentShell({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div
      className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ease-in-out ${
        isOpen ? 'lg:ml-60' : 'lg:ml-0'
      }`}
    >
      {children}
    </div>
  );
}
