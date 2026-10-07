import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

type Variant = 'success' | 'error' | 'warning' | 'info';

const styles: Record<Variant, { box: string; icon: string; name: IconName }> = {
  success: {
    box: 'bg-brand-50 text-brand-800 ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-400/20',
    icon: 'text-brand-600 dark:text-brand-400',
    name: 'checkCircle',
  },
  error: {
    box: 'bg-red-50 text-red-800 ring-red-600/15 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400/20',
    icon: 'text-red-600 dark:text-red-400',
    name: 'xCircle',
  },
  warning: {
    box: 'bg-amber-50 text-amber-900 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20',
    icon: 'text-amber-600 dark:text-amber-400',
    name: 'warning',
  },
  info: {
    box: 'bg-sky-50 text-sky-900 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-400/20',
    icon: 'text-sky-600 dark:text-sky-400',
    name: 'info',
  },
};

/** Inline feedback message (form success/error, warnings, tips). */
export function Notice({
  variant = 'info',
  children,
  className = '',
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const style = styles[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex animate-fade-in items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] leading-5 ring-1 ring-inset ${style.box} ${className}`}
    >
      <Icon name={style.name} className={`mt-0.5 h-4 w-4 flex-shrink-0 ${style.icon}`} strokeWidth={1.8} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
