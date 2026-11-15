import type { Entry } from "@/types";
import { scoresByDay } from "@/lib/stats/series";

export interface MomentumPoint {
  day: string;
  /** Sum of every update score logged that day. 0 when nothing was logged. */
  daily: number;
  /** Running total of `daily` from the first day of the window. */
  cumulative: number;
  count: number;
}

/**
 * Net direction per day and as a running total.
 * Daily = sum of that day's scores; cumulative = running total across `days`.
 */
export function buildMomentumSeries(entries: Entry[], days: string[]): MomentumPoint[] {
  const byDay = scoresByDay(entries);
  let running = 0;
  return days.map((day) => {
    const scores = byDay.get(day) ?? [];
    const daily = scores.reduce((s, v) => s + v, 0);
    running += daily;
    return { day, daily, cumulative: running, count: scores.length };
  });
}

/** Round axis ticks that cover [min, max] and always include 0. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  const span = hi - lo || target;
  const raw = span / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  const ticks: number[] = [];
  if (hi === lo) return [0, step, step * 2, step * 3, step * 4];
  for (let t = Math.floor(lo / step) * step; t <= Math.ceil(hi / step) * step + 1e-9; t += step) {
    ticks.push(Math.round(t * 1000) / 1000);
  }
  return ticks;
}
