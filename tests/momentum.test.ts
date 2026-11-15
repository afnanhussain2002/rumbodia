import { describe, expect, it } from "vitest";
import { buildMomentumSeries, niceTicks } from "@/lib/stats/momentum";
import type { Entry } from "@/types";

const entry = (createdAt: string, score: number) => ({ createdAt, score }) as Entry;

describe("buildMomentumSeries", () => {
  it("sums per day and accumulates, treating empty days as 0", () => {
    const days = ["2026-11-09", "2026-11-10", "2026-11-11"];
    const series = buildMomentumSeries(
      [entry("2026-11-09T12:00:00", 3), entry("2026-11-09T15:00:00", 2), entry("2026-11-11T12:00:00", -4)],
      days,
    );
    expect(series.map((p) => p.daily)).toEqual([5, 0, -4]);
    expect(series.map((p) => p.cumulative)).toEqual([5, 5, 1]);
    expect(series.map((p) => p.count)).toEqual([2, 0, 1]);
  });
});

describe("niceTicks", () => {
  it("includes zero and covers the range", () => {
    const t = niceTicks(2, 31);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]!).toBeGreaterThanOrEqual(31);
  });
  it("handles negatives and all-zero", () => {
    expect(niceTicks(-8, 6)).toContain(0);
    expect(niceTicks(0, 0).length).toBeGreaterThan(1);
  });
});
