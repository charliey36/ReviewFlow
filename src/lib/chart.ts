export type Point = { x: number; y: number };

/**
 * Smooth SVG path through the points (Catmull-Rom converted to cubic
 * Beziers). Control-point y values are clamped to [minY, maxY] so the curve
 * can never overshoot the chart area on sharp changes.
 */
export function smoothLinePath(points: Point[], minY: number, maxY: number): string {
  if (points.length === 0) return '';
  const clampY = (y: number) => Math.min(maxY, Math.max(minY, y));

  let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
    path += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

/** Closes a line path down to the baseline so it can be filled as an area. */
export function areaFromLine(line: string, points: Point[], baseY: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x.toFixed(2)} ${baseY} L${first.x.toFixed(2)} ${baseY} Z`;
}
