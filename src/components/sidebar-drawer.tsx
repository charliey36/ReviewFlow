'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/sidebar-context';
import { LogoOnDark } from '@/components/logo';
import { SidebarNav } from '@/components/sidebar-nav';

/**
 * The single source of truth for sidebar UI, used identically on desktop
 * and mobile — see sidebar-context.tsx for why this replaced the previous
 * two-sidebar setup (a static always-on desktop <aside> plus a separate,
 * defaults-closed mobile drawer that the toggle button didn't actually
 * control). Now there is exactly one sidebar, positioned fixed at all
 * breakpoints, sliding via `translate-x` based on shared SidebarContext
 * state. The parent layout shifts main content's left margin to match on
 * large screens; on small screens the sidebar overlays with a backdrop
 * instead, since there's no room to permanently reserve a column.
 */
export function SidebarDrawer() {
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();

  // On mobile, close the sidebar whenever the route changes (e.g. after
  // clicking a nav link), since it's an overlay there. On desktop this is
  // a no-op in practice because clicking a link doesn't call close().
  useEffect(() => {
    if (window.innerWidth < 1024) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Allow closing with the Escape key (mobile overlay use case).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && window.innerWidth < 1024) close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* Backdrop — only ever visible on small screens (lg:hidden), since
          on desktop the sidebar pushes content aside instead of
          overlaying it. */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-shrink-0 flex-col bg-brand-800 shadow-xl transition-transform duration-300 ease-in-out dark:bg-surface-sidebar dark:shadow-black/40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[65px] flex-shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard">
            <LogoOnDark />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-100/80 transition-colors duration-200 hover:bg-brand-700/60 hover:text-white lg:hidden"
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
        <div className="px-3 py-4 text-xs text-brand-200/60 dark:text-slate-500">
          &copy; {new Date().getFullYear()} ReviewFlow
        </div>
      </aside>
    </>
  );
}
