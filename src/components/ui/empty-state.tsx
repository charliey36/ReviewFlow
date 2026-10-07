import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

/** First-run / no-results state: glowing icon tile, headline, guidance, optional CTA. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center px-6 py-14 text-center ${className}`}>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-brand-600 shadow-card ring-1 ring-inset ring-line dark:text-brand-400">
        <span aria-hidden="true" className="absolute inset-0 -z-10 scale-125 rounded-2xl bg-brand-400/25 blur-xl" />
        <Icon name={icon} className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mt-5 text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-ink-3">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
