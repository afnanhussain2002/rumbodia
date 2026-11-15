import type { Entry } from "@/types";

export interface TagImpact {
  tag: string;
  average: number;
  count: number;
}

/** Average score per tag, highest first. Ties: more updates first, then name. */
export function tagImpact(entries: Entry[]): TagImpact[] {
  const sums = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    for (const tag of new Set(e.tags)) {
      const s = sums.get(tag) ?? { sum: 0, count: 0 };
      s.sum += e.score;
      s.count++;
      sums.set(tag, s);
    }
  }
  return [...sums.entries()]
    .map(([tag, s]) => ({ tag, average: s.sum / s.count, count: s.count }))
    .sort((a, b) => b.average - a.average || b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Tag → count, most used first. */
export function tagCounts(entries: Entry[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) for (const t of new Set(e.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
