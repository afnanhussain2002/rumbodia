/** Local-time date helpers. A "day" is always the user's local calendar day. */

import type { TimeOfDay, TimeOfDayStarts } from "@/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isoToDayKey(iso: string): string {
  return toDayKey(new Date(iso));
}

/** Parse a YYYY-MM-DD key as local midnight (not UTC). */
export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function isDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDayKey(dayKeyToDate(value)) === value;
}

/** The day key `delta` days before (negative) or after (positive) `key`. */
export function shiftDayKey(key: string, delta: number): string {
  const date = dayKeyToDate(key);
  return toDayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta));
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((dayKeyToDate(b).getTime() - dayKeyToDate(a).getTime()) / 86_400_000);
}

/** The last `count` day keys, oldest first, ending on `end`. */
export function dayKeysEnding(end: string, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) keys.push(shiftDayKey(end, -i));
  return keys;
}

/** The first day of the week that contains `key`. */
export function weekStartOf(key: string, weekStartsOn: 0 | 1): string {
  const dow = dayKeyToDate(key).getDay(); // 0 = Sunday
  const diff = (dow - weekStartsOn + 7) % 7;
  return shiftDayKey(key, -diff);
}

// ---------- Months ("YYYY-MM") ----------

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthKeyToDate(key: string): Date {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return new Date(y, m - 1, 1);
}

export function shiftMonthKey(key: string, delta: number): string {
  const d = monthKeyToDate(key);
  return toMonthKey(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}

export function daysInMonth(key: string): number {
  const d = monthKeyToDate(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** All day keys of a month, in order. */
export function monthDayKeys(key: string): string[] {
  const first = `${key}-01`;
  return Array.from({ length: daysInMonth(key) }, (_, i) => shiftDayKey(first, i));
}

/** Local-midnight ISO bounds [from, to) for a month. */
export function monthRange(key: string): { from: string; to: string } {
  const d = monthKeyToDate(key);
  return {
    from: d.toISOString(),
    to: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
  };
}

/** Local-midnight ISO bounds [from, to) for a span of day keys (inclusive end day). */
export function dayRange(fromDay: string, toDay: string): { from: string; to: string } {
  return {
    from: dayKeyToDate(fromDay).toISOString(),
    to: dayKeyToDate(shiftDayKey(toDay, 1)).toISOString(),
  };
}

/**
 * The calendar grid for a month: whole weeks, including leading/trailing days
 * from adjacent months.
 */
export function calendarGrid(monthKey: string, weekStartsOn: 0 | 1): { day: string; inMonth: boolean }[] {
  const days = monthDayKeys(monthKey);
  const start = weekStartOf(days[0]!, weekStartsOn);
  const lastDay = days[days.length - 1]!;
  const end = shiftDayKey(weekStartOf(lastDay, weekStartsOn), 6);
  const total = daysBetween(start, end) + 1;
  return Array.from({ length: total }, (_, i) => {
    const day = shiftDayKey(start, i);
    return { day, inMonth: day.startsWith(monthKey) };
  });
}

export function formatMonthTitle(key: string): string {
  return monthKeyToDate(key).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatMonthName(key: string): string {
  return monthKeyToDate(key).toLocaleDateString("en-US", { month: "long" });
}

/** Short weekday names, ordered by the week start. */
export function weekdayNames(weekStartsOn: 0 | 1, style: "short" | "narrow" = "short"): string[] {
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + ((i + weekStartsOn) % 7)).toLocaleDateString("en-US", { weekday: style }),
  );
}

// ---------- Formatting ----------

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Today", "Yesterday", or "Mon, Nov 2". */
export function formatDayHeading(key: string, today: string = toDayKey(new Date())): string {
  if (key === today) return "Today";
  if (key === shiftDayKey(today, -1)) return "Yesterday";
  return dayKeyToDate(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Today, Wed Nov 4" style used on entry day cards. */
export function formatDayCardTitle(key: string, today: string = toDayKey(new Date())): string {
  const short = dayKeyToDate(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (key === today) return `Today, ${short.replace(",", "")}`;
  if (key === shiftDayKey(today, -1)) return `Yesterday, ${short.replace(",", "")}`;
  return short;
}

/** "Wednesday, November 4" */
export function formatLongDay(key: string): string {
  return dayKeyToDate(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function formatShortWeekday(key: string): string {
  return dayKeyToDate(key).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatShortDate(key: string): string {
  return dayKeyToDate(key).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------- Time of day ----------

function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number) as [number, number];
  return (h || 0) * 60 + (m || 0);
}

/** Map a local time (minutes since midnight) to a part of the day using the Settings bounds. */
export function timeOfDayFromMinutes(minutes: number, starts: TimeOfDayStarts): TimeOfDay {
  const order: TimeOfDay[] = ["morning", "noon", "afternoon", "night"];
  const bounds = order.map((part) => ({ part, start: hhmmToMinutes(starts[part]) }));
  // Find the latest start that is <= minutes; if none, the period that wraps past midnight.
  const sorted = [...bounds].sort((a, b) => a.start - b.start);
  let current = sorted[sorted.length - 1]!.part;
  for (const b of sorted) {
    if (minutes >= b.start) current = b.part;
  }
  return current;
}

export function timeOfDayForDate(date: Date, starts: TimeOfDayStarts): TimeOfDay {
  return timeOfDayFromMinutes(date.getHours() * 60 + date.getMinutes(), starts);
}

/** "2026-11-04T07:42" for <input type="datetime-local"> */
export function toDateTimeLocalValue(date: Date): string {
  return `${toDayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
