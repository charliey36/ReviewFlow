'use client';

import { useSidebar } from '@/components/sidebar-context';

export function SidebarToggleButton() {
  const { toggle, isOpen } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isOpen}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
    >
      <svg
        className="h-6 w-6 transition-transform duration-200"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      </svg>
    </button>
  );
}
