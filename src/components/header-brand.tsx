'use client';

import Link from 'next/link';
import { useSidebar } from '@/components/sidebar-context';
import { Logo } from '@/components/logo';

/**
 * Logo in the top bar. Always shown on mobile (the sidebar is hidden there);
 * on desktop only when the sidebar is collapsed, since the sidebar carries
 * the logo otherwise.
 */
export function HeaderBrand() {
  const { isOpen } = useSidebar();

  return (
    <Link
      href="/dashboard"
      aria-label="ReviewFlow dashboard"
      className={`rounded-md ${isOpen ? 'lg:hidden' : ''}`}
    >
      <Logo />
    </Link>
  );
}
