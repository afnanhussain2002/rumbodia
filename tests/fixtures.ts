import type { Entry } from "@/types";

let n = 0;

/** A local-time entry on `day` at `hh:mm`. */
export function entry(day: string, score: number, extra: Partial<Entry> = {}, time = "09:00"): Entry {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  return {
    id: `e${++n}`,
    text: "did things",
    score,
    reason: "because",
    wins: [],
    slips: [],
    tags: [],
    boosts: [],
    drains: [],
    timeOfDay: "morning",
    createdAt: new Date(y, m - 1, d, hh, mm).toISOString(),
    updatedAt: null,
    model: "test",
    ...extra,
  };
}
