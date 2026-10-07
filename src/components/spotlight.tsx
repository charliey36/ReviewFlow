'use client';

import { useEffect } from 'react';

/**
 * Powers the `.spotlight` hover light with ONE delegated listener for the
 * whole app (instead of per-card React state): it writes the pointer
 * position into --mx / --my on the hovered element and CSS does the rest.
 * Mouse only; touch devices have no hover so we skip them.
 */
export function SpotlightProvider() {
  useEffect(() => {
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>('.spotlight');
      if (!el) return;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        el.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
