"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 600;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function sameValues(a: (number | null)[], b: (number | null)[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Tween a series to its new values (600ms ease-out). New points grow from 0.
 * Snaps without animation when the length changes (new range) or motion is reduced.
 */
export function useAnimatedValues(target: (number | null)[], reducedMotion: boolean): (number | null)[] {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    if (sameValues(from, target)) return;
    cancelAnimationFrame(frame.current);

    const set = (v: (number | null)[]) => {
      shownRef.current = v;
      setShown(v);
    };

    if (reducedMotion || from.length !== target.length) {
      frame.current = requestAnimationFrame(() => set(target));
      return () => cancelAnimationFrame(frame.current);
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const k = easeOut(t);
      set(
        target.map((to, i) => {
          if (to === null) return null;
          const a = from[i] ?? 0;
          return a + (to - a) * k;
        }),
      );
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, reducedMotion]);

  return shown;
}
