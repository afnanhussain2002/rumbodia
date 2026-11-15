import { describe, expect, it } from "vitest";
import { countDayLevels, countEntryLevels, totalCount } from "@/lib/stats/level-counts";
import { entry } from "./fixtures";

describe("level counts", () => {
  const entries = [
    entry("2026-11-01", 8),
    entry("2026-11-01", 6), // day avg 7 → soaring
    entry("2026-11-02", -8), // falling
    entry("2026-11-03", 2),
    entry("2026-11-03", 4), // day avg 3 → rising
  ];

  it("counts days by their average", () => {
    expect(countDayLevels(entries)).toEqual({ soaring: 1, rising: 1, steady: 0, slipping: 0, falling: 1 });
  });

  it("counts individual updates by their own score", () => {
    const c = countEntryLevels(entries);
    expect(c).toEqual({ soaring: 1, rising: 2, steady: 1, slipping: 0, falling: 1 });
    expect(totalCount(c)).toBe(5);
  });
});
