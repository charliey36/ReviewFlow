'use client';

import { useTheme } from '@/components/theme-context';
import { Icon } from '@/components/ui/icons';

export function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="btn btn-ghost btn-icon"
    >
      <Icon name={isDark ? 'sun' : 'moon'} className="h-[18px] w-[18px]" />
    </button>
  );
}
