import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink-2 ring-line-strong/70',
  success:
    'bg-brand-500/10 text-brand-700 ring-brand-600/20 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/25',
  warning:
    'bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25',
  danger: 'bg-red-500/10 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25',
  info: 'bg-sky-500/10 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
};

// The dot gets a soft halo of its own color: reads as "live status".
const dots: Record<BadgeTone, string> = {
  neutral: 'bg-ink-4',
  success: 'bg-brand-500 shadow-[0_0_0_3px_rgb(16_185_129/0.22)]',
  warning: 'bg-amber-500 shadow-[0_0_0_3px_rgb(245_158_11/0.22)]',
  danger: 'bg-red-500 shadow-[0_0_0_3px_rgb(239_68_68/0.22)]',
  info: 'bg-sky-500 shadow-[0_0_0_3px_rgb(14_165_233/0.22)]',
};

/** Status pill. `dot` adds the leading colored dot used for statuses. */
export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className = '',
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium leading-4 ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Maps a review request status to its badge tone. */
export function requestStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'sent':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}
