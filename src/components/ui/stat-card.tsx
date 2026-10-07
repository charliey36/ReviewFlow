import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { describeDelta, type DeltaDirection } from '@/lib/trends';
import { Icon, type IconName } from './icons';
import { Sparkline } from './sparkline';
import { toneStyle, type Tone } from './tones';

export type StatTrend = {
  /** Sum for the most recent period. */
  current: number;
  /** Sum for the period before it. */
  previous: number;
  /** Daily series for the sparkline (oldest first). */
  series: number[];
};

const positive = 'bg-brand-500/10 text-brand-700 ring-brand-600/20 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/25';
const negative = 'bg-red-500/10 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25';
const neutral = 'bg-surface-muted text-ink-3 ring-line-strong/60';

function deltaTone(direction: DeltaDirection, lowerIsBetter: boolean) {
  if (direction === 'flat') return neutral;
  // Direction (arrow) and sentiment (color) are decoupled: for metrics like
  // failures, a rising number is bad news and should read as red.
  const good = lowerIsBetter ? direction === 'down' : direction === 'up';
  return good ? positive : negative;
}

/**
 * KPI tile: label, headline value, and (optionally) the change vs the
 * previous period plus a sparkline. Each tile takes a hue (`tone`) that
 * colors its icon tile, ambient wash, sparkline and hover light, so a row of
 * KPIs is scannable by color as well as by label. Pass `children` to replace
 * the default delta/sparkline row with custom content (e.g. a gauge).
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'emerald',
  hint,
  trend,
  trendLabel = 'vs previous 7 days',
  lowerIsBetter = false,
  href,
  sparkId,
  className = '',
  style,
  children,
}: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  tone?: Tone;
  hint?: ReactNode;
  trend?: StatTrend | null;
  trendLabel?: string;
  lowerIsBetter?: boolean;
  href?: string;
  sparkId?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const hasActivity = Boolean(trend && (trend.current > 0 || trend.previous > 0));
  const delta = trend && hasActivity ? describeDelta(trend.current, trend.previous) : null;
  const cardStyle = { ...toneStyle(tone), ...style };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-3">{label}</p>
        {icon && (
          <span className="tone-tile flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 ease-out-expo group-hover:-rotate-3 group-hover:scale-110">
            <Icon name={icon} className="h-5 w-5" strokeWidth={1.7} />
          </span>
        )}
      </div>

      <div className="mt-4 text-[40px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">{value}</div>

      {children ? (
        <div className="mt-4">{children}</div>
      ) : (
        <div className="mt-4 flex min-h-10 items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
            {delta ? (
              <>
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold tabular-nums ring-1 ring-inset ${deltaTone(
                    delta.direction,
                    lowerIsBetter
                  )}`}
                >
                  {delta.direction === 'up' && <Icon name="arrowUp" className="h-3 w-3" strokeWidth={2.6} />}
                  {delta.direction === 'down' && <Icon name="arrowDown" className="h-3 w-3" strokeWidth={2.6} />}
                  {delta.label}
                </span>
                <span>{trendLabel}</span>
              </>
            ) : (
              hint ?? (trend ? 'No activity in the last 14 days' : null)
            )}
          </div>
          {trend && trend.series.length > 1 && (
            <Sparkline data={trend.series} id={sparkId ?? label.replace(/\W+/g, '-')} tone={tone} />
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={cardStyle}
        className={`card-interactive spotlight tone-wash group flex flex-col overflow-hidden p-5 ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div style={cardStyle} className={`card spotlight tone-wash group flex flex-col overflow-hidden p-5 ${className}`}>
      {content}
    </div>
  );
}
