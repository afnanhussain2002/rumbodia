import type { DailyPoint, Entry } from "@/types";
import { LEVEL_BOUNDARIES, scoreToLevel, type LevelKey } from "@/lib/levels";
import { isoToDayKey, shiftDayKey, weekStartOf } from "@/lib/utils/date";
import { mean } from "@/lib/utils/scores";

/** Group entry scores by local day. */
export function scoresByDay(entries: Entry[]): Map<string, number[]> {
  const byDay = new Map<string, number[]>();
  for (const entry of entries) {
    const key = isoToDayKey(entry.createdAt);
    const list = byDay.get(key);
    if (list) list.push(entry.score);
    else byDay.set(key, [entry.score]);
  }
  return byDay;
}

/** Day average for each day with entries. */
export function dayAverages(entries: Entry[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const [day, scores] of scoresByDay(entries)) out.set(day, mean(scores)!);
  return out;
}

/** One point per given day. Days with no entries have a null average. */
export function buildDaySeries(entries: Entry[], days: string[]): DailyPoint[] {
  const byDay = scoresByDay(entries);
  return days.map((day) => {
    const scores = byDay.get(day) ?? [];
    return { day, average: mean(scores), count: scores.length };
  });
}

/** One point per week (week start key) covering [firstDay, lastDay]. */
export function buildWeeklySeries(
  entries: Entry[],
  firstDay: string,
  lastDay: string,
  weekStartsOn: 0 | 1,
): DailyPoint[] {
  const byWeek = new Map<string, number[]>();
  for (const entry of entries) {
    const week = weekStartOf(isoToDayKey(entry.createdAt), weekStartsOn);
    const list = byWeek.get(week);
    if (list) list.push(entry.score);
    else byWeek.set(week, [entry.score]);
  }
  const points: DailyPoint[] = [];
  for (let week = weekStartOf(firstDay, weekStartsOn); week <= lastDay; week = shiftDayKey(week, 7)) {
    const scores = byWeek.get(week) ?? [];
    points.push({ day: week, average: mean(scores), count: scores.length });
  }
  return points;
}

// ---------- Line segmentation by level ----------

export interface XY {
  x: number;
  /** Score, -10..10. */
  y: number;
}

export interface LevelSegment {
  level: LevelKey;
  points: XY[];
}

/** Consecutive non-null runs. A null value breaks the line. */
export function splitRuns(values: (number | null)[]): XY[][] {
  const runs: XY[][] = [];
  let current: XY[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) runs.push(current);
      current = [];
    } else {
      current.push({ x: i, y: v });
    }
  });
  if (current.length) runs.push(current);
  return runs;
}

/**
 * Split a polyline (in score space) wherever it crosses a level boundary,
 * so each part can be drawn in its own level color. Adjacent parts with the
 * same level are merged into one segment.
 */
export function splitByLevel(run: XY[]): LevelSegment[] {
  if (run.length === 0) return [];
  if (run.length === 1) return [{ level: scoreToLevel(run[0]!.y).key, points: [run[0]!] }];

  const pieces: { level: LevelKey; a: XY; b: XY }[] = [];
  for (let i = 0; i < run.length - 1; i++) {
    const a = run[i]!;
    const b = run[i + 1]!;
    const lo = Math.min(a.y, b.y);
    const hi = Math.max(a.y, b.y);
    const crossings = LEVEL_BOUNDARIES.filter((t) => t > lo && t < hi)
      .map((t) => ({ x: a.x + ((t - a.y) / (b.y - a.y)) * (b.x - a.x), y: t }))
      .sort((p, q) => p.x - q.x);
    const stops = [a, ...crossings, b];
    for (let j = 0; j < stops.length - 1; j++) {
      const p = stops[j]!;
      const q = stops[j + 1]!;
      pieces.push({ level: scoreToLevel((p.y + q.y) / 2).key, a: p, b: q });
    }
  }

  const segments: LevelSegment[] = [];
  for (const piece of pieces) {
    const last = segments[segments.length - 1];
    if (last && last.level === piece.level) last.points.push(piece.b);
    else segments.push({ level: piece.level, points: [piece.a, piece.b] });
  }
  return segments;
}

// ---------- Plain-language trend ----------

export type TrendDirection = "up" | "down" | "flat";

/**
 * Least-squares slope over the logged points, in score per point (day).
 * Needs at least 3 logged points; a total change under 1.5 points across the range reads as flat.
 */
export function seriesTrend(points: DailyPoint[]): { direction: TrendDirection; change: number } | null {
  const xy = points.flatMap((p, i) => (p.average === null ? [] : [{ x: i, y: p.average }]));
  if (xy.length < 3) return null;
  const mx = xy.reduce((s, p) => s + p.x, 0) / xy.length;
  const my = xy.reduce((s, p) => s + p.y, 0) / xy.length;
  let num = 0;
  let den = 0;
  for (const p of xy) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const change = slope * (xy[xy.length - 1]!.x - xy[0]!.x);
  const direction: TrendDirection = Math.abs(change) < 1.5 ? "flat" : change > 0 ? "up" : "down";
  return { direction, change };
}
