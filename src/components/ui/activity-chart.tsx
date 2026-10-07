'use client';

import { useId, useRef, useState } from 'react';
import { areaFromLine, smoothLinePath, type Point } from '@/lib/chart';
import { toneRgb, type Tone } from './tones';

export type ChartSeries = { key: string; label: string; tone: Tone; data: number[] };

const WIDTH = 720;
const HEIGHT = 300;
const PAD_X = 14;
const PAD_TOP = 18;
const PAD_BOTTOM = 14;

/**
 * Interactive multi-series area chart (dependency-free SVG). Hover or touch
 * to get a crosshair and a tooltip with every series' value for that day;
 * lines draw in on load. Axis labels are HTML so text never distorts when
 * the SVG scales to its container.
 */
export function ActivityChart({ labels, series }: { labels: string[]; series: ChartSeries[] }) {
  const gid = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const count = labels.length;
  if (count < 2 || series.length === 0) return null;

  const max = Math.max(4, ...series.flatMap((item) => item.data));
  const ceiling = Math.ceil(max * 1.15);
  const xAt = (index: number) => PAD_X + (index / (count - 1)) * (WIDTH - PAD_X * 2);
  const yAt = (value: number) => PAD_TOP + (1 - value / ceiling) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  const baseline = HEIGHT - PAD_BOTTOM;

  const drawn = series.map((item) => {
    const points: Point[] = item.data.map((value, index) => ({ x: xAt(index), y: yAt(value) }));
    const line = smoothLinePath(points, PAD_TOP, baseline);
    return { ...item, points, line, area: areaFromLine(line, points, baseline) };
  });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const index = Math.round(((x - PAD_X) / (WIDTH - PAD_X * 2)) * (count - 1));
    setHover(Math.max(0, Math.min(count - 1, index)));
  };

  const flip = hover !== null && hover > (count - 1) * 0.62;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Daily ${series.map((item) => item.label.toLowerCase()).join(' and ')} for the last ${count} days`}
        >
          <defs>
            {drawn.map((item) => (
              <linearGradient key={item.key} id={`${gid}-${item.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={`rgb(${toneRgb(item.tone)})`} stopOpacity="0.32" />
                <stop offset="100%" stopColor={`rgb(${toneRgb(item.tone)})`} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0, 1, 2, 3].map((step) => {
            const y = PAD_TOP + (step / 3) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
            return (
              <line
                key={step}
                x1={0}
                x2={WIDTH}
                y1={y}
                y2={y}
                stroke="rgb(var(--line-strong))"
                strokeOpacity={step === 3 ? 0.9 : 0.55}
                strokeDasharray={step === 3 ? undefined : '3 6'}
              />
            );
          })}

          {drawn.map((item) => (
            <g key={item.key}>
              <path d={item.area} fill={`url(#${gid}-${item.key})`} className="animate-fade-in [animation-delay:400ms]" />
              <path
                d={item.line}
                fill="none"
                stroke={`rgb(${toneRgb(item.tone)})`}
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={0}
                className="draw-line"
              />
            </g>
          ))}

          {hover !== null && (
            <g>
              <line
                x1={xAt(hover)}
                x2={xAt(hover)}
                y1={PAD_TOP - 6}
                y2={baseline}
                stroke="rgb(var(--ink-4))"
                strokeOpacity="0.55"
                strokeDasharray="3 4"
              />
              {drawn.map((item) => (
                <g key={item.key}>
                  <circle cx={xAt(hover)} cy={item.points[hover].y} r="8" fill={`rgb(${toneRgb(item.tone)})`} opacity="0.2" />
                  <circle
                    cx={xAt(hover)}
                    cy={item.points[hover].y}
                    r="4.5"
                    fill={`rgb(${toneRgb(item.tone)})`}
                    stroke="rgb(var(--surface))"
                    strokeWidth="2.5"
                  />
                </g>
              ))}
            </g>
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 w-44 rounded-xl border border-line bg-surface/95 p-3 shadow-pop backdrop-blur-md"
            style={{
              left: `${(xAt(hover) / WIDTH) * 100}%`,
              transform: `translateX(${flip ? 'calc(-100% - 16px)' : '16px'})`,
            }}
          >
            <p className="text-xs font-semibold text-ink">{labels[hover]}</p>
            <div className="mt-2 space-y-1.5">
              {series.map((item) => (
                <p key={item.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-ink-3">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgb(${toneRgb(item.tone)})` }} />
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums text-ink">{item.data[hover]}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-2xs font-medium text-ink-4">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor((count - 1) / 2)]}</span>
        <span>{labels[count - 1]}</span>
      </div>
    </div>
  );
}
