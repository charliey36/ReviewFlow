'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/sidebar-context';
import { LogoOnDark } from '@/components/logo';
import { SidebarNav } from '@/components/sidebar-nav';

export function SidebarDrawer() {
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();

  // Close the drawer whenever the route changes (e.g. after clicking a nav link).
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Allow closing with the Escape key.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-shrink-0 flex-col bg-brand-800 shadow-card-lg transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[65px] flex-shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" onClick={close}>
            <LogoOnDark />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-100/80 transition-colors hover:bg-brand-700/60 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarNav />
        <div className="px-3 py-4 text-xs text-brand-200/60">
          &copy; {new Date().getFullYear()} ReviewFlow
        </div>
      </aside>
    </>
  );
}
