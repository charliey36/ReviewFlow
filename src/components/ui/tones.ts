import type { CSSProperties } from 'react';

/**
 * Data hues. A component opts into one with `style={toneStyle('sky')}` and
 * then uses the .tone-* classes (see globals.css), which read --tone and
 * --tone-deep. Keeps color decisions in one place and works in light + dark.
 */
export type Tone = 'emerald' | 'teal' | 'sky' | 'violet' | 'amber' | 'rose' | 'slate';

const tones: Record<Tone, { main: string; deep: string }> = {
  emerald: { main: '16 185 129', deep: '4 120 87' },
  teal: { main: '20 184 166', deep: '15 118 110' },
  sky: { main: '14 165 233', deep: '3 105 161' },
  violet: { main: '139 92 246', deep: '109 40 217' },
  amber: { main: '245 158 11', deep: '180 83 9' },
  rose: { main: '244 63 94', deep: '190 18 60' },
  slate: { main: '100 116 139', deep: '51 65 85' },
};

export function toneStyle(tone: Tone): CSSProperties {
  return { '--tone': tones[tone].main, '--tone-deep': tones[tone].deep } as CSSProperties;
}

/** Raw "R G B" channels for SVG fills/strokes: rgb(${toneRgb('sky')}) */
export function toneRgb(tone: Tone): string {
  return tones[tone].main;
}
