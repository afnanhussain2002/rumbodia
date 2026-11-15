import { shiftDayKey } from "@/lib/utils/date";

export interface StreakResult {
  current: number;
  longest: number;
  lastFiveDays: { day: string; logged: boolean }[];
  /** Today has no entry yet but yesterday does: the chain is at risk. */
  atRisk: boolean;
}

/**
 * A day counts if it has at least one entry.
 * `dayKeys` may contain duplicates and be in any order.
 */
export function computeStreaks(dayKeys: string[], today: string): StreakResult {
  const logged = new Set(dayKeys);
  const yesterday = shiftDayKey(today, -1);
  const todayLogged = logged.has(today);

  // Current streak: count back from today, or from yesterday if today is still open.
  let current = 0;
  let cursor = todayLogged ? today : yesterday;
  while (logged.has(cursor)) {
    current++;
    cursor = shiftDayKey(cursor, -1);
  }

  // Longest streak across all time.
  const sorted = [...logged].filter((d) => d <= today).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && shiftDayKey(prev, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  longest = Math.max(longest, current);

  const end = todayLogged ? today : yesterday;
  const lastFiveDays = [4, 3, 2, 1, 0].map((back) => {
    const day = shiftDayKey(end, -back);
    return { day, logged: logged.has(day) };
  });

  return { current, longest, lastFiveDays, atRisk: !todayLogged && logged.has(yesterday) };
}
