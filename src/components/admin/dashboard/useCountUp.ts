'use client';

import { useEffect, useState } from 'react';

type CountUpOptions = Readonly<{
  durationMs?: number;
  resetKey?: string | number;
}>;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

export function useCountUp(target: number, { durationMs = 800, resetKey }: CountUpOptions = {}) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!Number.isFinite(target) || prefersReducedMotion()) {
      setValue(Number.isFinite(target) ? target : 0);
      return undefined;
    }

    let frame = 0;
    const startedAt = performance.now();

    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / durationMs);
      setValue(target * easeOutCubic(progress));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    setValue(0);
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [durationMs, resetKey, target]);

  return value;
}
