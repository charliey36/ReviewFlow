import { areaFromLine, smoothLinePath, type Point } from '@/lib/chart';
import { toneRgb, type Tone } from './tones';

/**
 * Tiny dependency-free trend line for KPI cards. Shows shape only (no axes):
 * the headline number and delta carry the meaning, the sparkline adds the
 * trajectory. The line draws itself in on load. `id` must be unique per
 * instance (it scopes the gradient).
 */
export function Sparkline({
  data,
  id,
  tone = 'emerald',
  className = 'h-10 w-28',
}: {
  data: number[];
  id: string;
  tone?: Tone;
  className?: string;
}) {
  const width = 112;
  const height = 40;
  const pad = 4;

  if (data.length < 2) return null;

  const flat = data.every((value) => value === 0);
  const max = Math.max(...data, 1);
  const stepX = (width - pad * 2) / (data.length - 1);

  const points: Point[] = data.map((value, index) => ({
    x: pad + index * stepX,
    y: flat ? height - pad : height - pad - (value / max) * (height - pad * 2),
  }));

  const line = smoothLinePath(points, pad, height - pad);
  const area = areaFromLine(line, points, height);
  const last = points[points.length - 1];
  const gradientId = `spark-${id}`;
  const color = flat ? 'rgb(var(--line-strong))' : `rgb(${toneRgb(tone)})`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} style={{ color }} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={flat ? 0 : 0.28} />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in [animation-delay:500ms]" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={0}
        className="draw-line"
      />
      {!flat && (
        <>
          <circle cx={last.x} cy={last.y} r="5" fill="currentColor" opacity="0.18" className="animate-fade-in [animation-delay:900ms]" />
          <circle cx={last.x} cy={last.y} r="2.5" fill="currentColor" className="animate-pop-in [animation-delay:900ms]" />
        </>
      )}
    </svg>
  );
}
