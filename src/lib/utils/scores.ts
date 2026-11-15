import type { Entry } from "@/types";
import { isoToDayKey } from "@/lib/utils/date";

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Every entry from one local day, oldest first. */
export function entriesForDay(entries: Entry[], day: string): Entry[] {
  return entries
    .filter((entry) => isoToDayKey(entry.createdAt) === day)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** "+3", "−2.5", "0". Uses a real minus sign. */
export function formatScore(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "0";
  const text = Number.isInteger(rounded) ? String(Math.abs(rounded)) : Math.abs(rounded).toFixed(1);
  return `${rounded > 0 ? "+" : "−"}${text}`;
}
