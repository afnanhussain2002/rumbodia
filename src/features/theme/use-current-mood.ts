"use client";

import { useMemo } from "react";
import type { Entry } from "@/types";
import { scoreToLevel, type Level } from "@/lib/levels";
import { isoToDayKey, shiftDayKey, toDayKey } from "@/lib/utils/date";
import { mean } from "@/lib/utils/scores";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";

export interface CurrentMood {
  level: Level;
  average: number;
  /** Which day the mood comes from. */
  source: "today" | "yesterday";
  count: number;
}

/** Today's average → yesterday's average → null (neutral). Pure, for tests and reuse. */
export function computeMood(entries: Entry[], today = toDayKey(new Date())): CurrentMood | null {
  const yesterday = shiftDayKey(today, -1);
  const byDay = (day: string) => entries.filter((e) => isoToDayKey(e.createdAt) === day).map((e) => e.score);
  for (const [day, source] of [
    [today, "today"],
    [yesterday, "yesterday"],
  ] as const) {
    const scores = byDay(day);
    const avg = mean(scores);
    if (avg !== null) return { level: scoreToLevel(avg), average: avg, source, count: scores.length };
  }
  return null;
}

export function useCurrentMood(): CurrentMood | null {
  const { data } = useAllEntries();
  return useMemo(() => (data ? computeMood(data) : null), [data]);
}
