import type { Entry } from "@/types";
import { LEVELS, scoreToLevel, type LevelKey } from "@/lib/levels";
import { dayAverages } from "@/lib/stats/series";

export type LevelCounts = Record<LevelKey, number>;

export function emptyCounts(): LevelCounts {
  return Object.fromEntries(LEVELS.map((l) => [l.key, 0])) as LevelCounts;
}

/** Number of days at each level (by the day's average score). */
export function countDayLevels(entries: Entry[]): LevelCounts {
  const counts = emptyCounts();
  for (const avg of dayAverages(entries).values()) counts[scoreToLevel(avg).key]++;
  return counts;
}

/** Number of individual entries at each level. */
export function countEntryLevels(entries: Entry[]): LevelCounts {
  const counts = emptyCounts();
  for (const e of entries) counts[scoreToLevel(e.score).key]++;
  return counts;
}

export function totalCount(counts: LevelCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}
