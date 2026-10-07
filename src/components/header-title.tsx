'use client';

import { usePathname } from 'next/navigation';
import { isActivePath, navGroups } from '@/components/sidebar-nav';

/** Current section name in the top bar (orientation when the sidebar is collapsed). */
export function HeaderTitle() {
  const pathname = usePathname();

  const match = navGroups
    .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
    .filter((item) => isActivePath(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (!match) return null;

  return (
    <div className="ml-1 hidden min-w-0 items-center gap-2 text-sm sm:flex">
      <span className="text-ink-4">{match.group}</span>
      <span aria-hidden="true" className="text-ink-4">
        /
      </span>
      <span className="truncate font-semibold text-ink">{match.label}</span>
    </div>
  );
}
