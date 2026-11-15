import type { Entry, TimeOfDay } from "@/types";
import { TIMES_OF_DAY } from "@/lib/constants";

export interface TimeOfDayStat {
  part: TimeOfDay;
  average: number | null;
  count: number;
}

export function timeOfDayStats(entries: Entry[]): TimeOfDayStat[] {
  return TIMES_OF_DAY.map((part) => {
    const scores = entries.filter((e) => e.timeOfDay === part).map((e) => e.score);
    return {
      part,
      count: scores.length,
      average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    };
  });
}

const PLURAL: Record<TimeOfDay, string> = {
  morning: "mornings",
  noon: "noons",
  afternoon: "afternoons",
  night: "nights",
};

/** One line naming the best part of the day, or null when there is not enough to compare. */
export function timeOfDayCaption(stats: TimeOfDayStat[]): string | null {
  const withData = stats.filter((s) => s.average !== null);
  if (withData.length === 0) return null;
  if (withData.length === 1) return `So far you only log in the ${withData[0]!.part}. Try another time too.`;
  const best = [...withData].sort((a, b) => b.average! - a.average! || b.count - a.count)[0]!;
  const p = PLURAL[best.part];
  return `Your ${p} are your strongest time.`;
}
