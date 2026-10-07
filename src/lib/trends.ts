const DAY_MS = 86_400_000;

/**
 * Buckets event timestamps into one count per UTC day for the last `days`
 * days (oldest first, today last). Used for KPI sparklines and period-over-
 * period deltas, so both always come from the same data.
 */
export function bucketDaily(
  timestamps: Array<string | null | undefined>,
  days = 14,
  now: Date = new Date()
): number[] {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = todayStart - (days - 1) * DAY_MS;
  const buckets = new Array<number>(days).fill(0);

  for (const ts of timestamps) {
    if (!ts) continue;
    const t = Date.parse(ts);
    if (Number.isNaN(t) || t < start || t >= todayStart + DAY_MS) continue;
    buckets[Math.floor((t - start) / DAY_MS)] += 1;
  }

  return buckets;
}

/** Splits a daily series into its older half and newer half and sums each. */
export function splitPeriods(series: number[]): { current: number; previous: number } {
  const half = Math.floor(series.length / 2);
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  return {
    previous: sum(series.slice(0, half)),
    current: sum(series.slice(series.length - half)),
  };
}

export type DeltaDirection = 'up' | 'down' | 'flat';

/**
 * Describes the change between two periods as a short label + direction.
 * Avoids "Infinity%" when the previous period had no activity.
 */
export function describeDelta(current: number, previous: number): { direction: DeltaDirection; label: string } {
  if (current === 0 && previous === 0) return { direction: 'flat', label: 'No change' };
  if (previous === 0) return { direction: 'up', label: `+${current}` };

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { direction: 'flat', label: '0%' };
  return pct > 0 ? { direction: 'up', label: `+${pct}%` } : { direction: 'down', label: `${pct}%` };
}
