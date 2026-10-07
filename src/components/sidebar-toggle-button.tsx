'use client';

import { useSidebar } from '@/components/sidebar-context';
import { Icon } from '@/components/ui/icons';

export function SidebarToggleButton() {
  const { toggle, isOpen } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={isOpen}
      className="btn btn-ghost btn-icon -ml-1.5"
    >
      <Icon name="menu" className="h-5 w-5" />
    </button>
  );
}
