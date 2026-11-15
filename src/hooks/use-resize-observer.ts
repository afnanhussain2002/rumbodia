"use client";

import { useCallback, useState } from "react";

/** Tracks an element's content-box size. Returns a callback ref and the size. */
export function useResizeObserver<T extends HTMLElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const ref = useCallback((node: T | null) => {
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize((prev) =>
        Math.round(prev.width) === Math.round(rect.width) && Math.round(prev.height) === Math.round(rect.height)
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
