import type { ReactNode } from 'react';

/**
 * Circular progress with a gradient arc that sweeps in on load. `id` scopes
 * the gradient so several rings can share a page.
 */
export function ProgressRing({
  percent,
  id,
  size = 156,
  stroke = 12,
  from = '#34d399',
  to = '#0d9488',
  children,
}: {
  percent: number;
  id: string;
  size?: number;
  stroke?: number;
  from?: string;
  to?: string;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const gradientId = `ring-${id}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-surface-muted" />
        {clamped > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - clamped}
            className="ring-anim"
            style={{ filter: `drop-shadow(0 4px 10px ${from}66)` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
