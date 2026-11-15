import type { Entry } from "@/types";

export interface FeelingStat {
  /** Display text (the most recent spelling). */
  label: string;
  count: number;
  /** Average score of the updates that mention it, rounded to 1 decimal. */
  average: number;
}

export interface FeelingPatterns {
  boosts: FeelingStat[];
  drains: FeelingStat[];
}

function collect(entries: Entry[], pick: (e: Entry) => string[]): FeelingStat[] {
  const map = new Map<string, { label: string; scores: number[]; last: string }>();
  for (const e of entries) {
    for (const raw of pick(e)) {
      const key = raw.trim().toLowerCase();
      if (!key) continue;
      const row = map.get(key) ?? { label: raw.trim(), scores: [], last: "" };
      row.scores.push(e.score);
      if (e.createdAt >= row.last) {
        row.last = e.createdAt;
        row.label = raw.trim();
      }
      map.set(key, row);
    }
  }
  return [...map.values()]
    .map((r) => ({
      label: r.label,
      count: r.scores.length,
      average: Math.round((r.scores.reduce((s, v) => s + v, 0) / r.scores.length) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count || b.average - a.average || a.label.localeCompare(b.label));
}

/** What the user says lifts them and what lowers them, most repeated first. */
export function feelingPatterns(entries: Entry[], limit = Infinity): FeelingPatterns {
  return {
    boosts: collect(entries, (e) => e.boosts).slice(0, limit),
    drains: collect(entries, (e) => e.drains).slice(0, limit),
  };
}
