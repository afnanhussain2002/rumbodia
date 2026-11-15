"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

/**
 * Traps Tab focus inside `ref`, closes on Escape, locks page scroll,
 * and restores focus to the previously focused element on close.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onEscape: () => void,
  initialFocus?: React.RefObject<HTMLElement | null>,
) {
  const ref = useRef<T>(null);
  const escRef = useRef(onEscape);
  useEffect(() => {
    escRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;

    // Focus after paint so autofocus targets exist.
    const raf = requestAnimationFrame(() => {
      const target = initialFocus?.current ?? node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? node)?.focus({ preventScroll: true });
    });

    openCount++;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (!node) return;
      // Only the top-most open layer reacts.
      const layers = document.querySelectorAll('[aria-modal="true"]');
      if (layers[layers.length - 1] !== node) return;

      if (e.key === "Escape") {
        e.preventDefault();
        escRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      openCount--;
      if (openCount === 0) document.body.style.overflow = prevOverflow === "hidden" ? "" : prevOverflow;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, initialFocus]);

  return ref;
}
