import type { ReactNode } from 'react';

/**
 * Standard content card: optional title/description/action header, then the
 * body. `flush` removes body padding (tables, lists) and clips children to
 * the rounded corners.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  flush = false,
  className = '',
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  const hasHeader = Boolean(title || action);

  return (
    <section className={`card ${flush ? 'overflow-hidden' : ''} ${className}`}>
      {hasHeader && (
        <div
          className={`flex items-start justify-between gap-4 px-5 sm:px-6 ${
            flush ? 'border-b border-line py-4' : 'pt-5 sm:pt-6'
          }`}
        >
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
            {description && <p className="mt-1 text-[13px] leading-5 text-ink-3">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={flush ? '' : `p-5 sm:p-6 ${hasHeader ? 'pt-4 sm:pt-5' : ''}`}>{children}</div>
    </section>
  );
}
