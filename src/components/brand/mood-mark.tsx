"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";
import { LEVELS, type LevelKey } from "@/lib/levels";
import { markInner, type MarkLevel } from "@/components/brand/mark";

const isLevel = (v: string | undefined): v is LevelKey => LEVELS.some((l) => l.key === v);

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood"] });
  return () => observer.disconnect();
}

/**
 * The level the whole page is currently showing (`<html data-mood>`), or null when it is neutral.
 * Server render and first paint are null, so nothing mismatches while hydrating.
 */
export function usePageMood(): LevelKey | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.mood ?? "",
    () => "",
  );
  return isLevel(raw) ? raw : null;
}

interface MoodMarkProps {
  /** A fixed face. Leave out to follow the page's mood (the same color the buttons use). */
  level?: MarkLevel;
  /** Gentle floating. Switched off by the in-app "Mascot animations" setting. */
  animated?: boolean;
  className?: string;
}

/** The logo's triangle, as a big character. Fills the box it is placed in. */
export function MoodMark({ level, animated = true, className }: MoodMarkProps) {
  const page = usePageMood();
  const shown: MarkLevel = level ?? page ?? "brand";
  return (
    <svg
      viewBox="3 4 94 90"
      preserveAspectRatio="xMidYMax meet"
      className={cn("h-full w-full", animated && "mark-bob", className)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markInner(shown) }}
    />
  );
}
