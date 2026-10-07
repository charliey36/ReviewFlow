import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { toneStyle, type Tone } from './tones';

/**
 * Consistent page title block: back link, optional colored icon tile, h1,
 * description, and a right-aligned actions slot. `tabs` renders flush
 * against the bottom hairline (used by the Settings sub-navigation).
 */
export function PageHeader({
  title,
  description,
  actions,
  adornment,
  back,
  tabs,
  icon,
  tone = 'emerald',
  leading,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Small element rendered inline after the title (status badges, etc). */
  adornment?: ReactNode;
  back?: { href: string; label: string };
  tabs?: ReactNode;
  icon?: IconName;
  tone?: Tone;
  /** Replaces the icon tile (e.g. a customer avatar). */
  leading?: ReactNode;
}) {
  return (
    <header className={tabs ? 'mb-8 border-b border-line' : 'mb-8'}>
      {back && (
        <Link
          href={back.href}
          className="group mb-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/70 py-1 pl-2 pr-3 text-[13px] font-medium text-ink-3 shadow-xs transition duration-200 hover:border-brand-500/40 hover:text-ink"
        >
          <Icon
            name="arrowLeft"
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
          {back.label}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-start gap-4">
          {leading ? (
            <span className="mt-0.5 hidden flex-shrink-0 sm:block">{leading}</span>
          ) : icon ? (
            <span
              style={toneStyle(tone)}
              className="tone-tile mt-0.5 hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl sm:flex"
            >
              <Icon name={icon} className="h-6 w-6" strokeWidth={1.6} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[34px] sm:leading-[1.15]">
              {title}
              {adornment}
            </h1>
            {description && <p className="mt-2 max-w-2xl text-[15px] leading-6 text-ink-3">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {tabs && <div className="mt-7 -mb-px">{tabs}</div>}
    </header>
  );
}
