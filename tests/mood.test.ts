import { describe, expect, it } from "vitest";
import { computeMood } from "@/features/theme/use-current-mood";
import { entry } from "./fixtures";

describe("computeMood", () => {
  const today = "2026-11-17";

  it("uses today's average when there are entries today", () => {
    const mood = computeMood([entry(today, 8), entry(today, 6), entry("2026-11-16", -9)], today);
    expect(mood?.source).toBe("today");
    expect(mood?.average).toBe(7);
    expect(mood?.level.key).toBe("soaring");
    expect(mood?.count).toBe(2);
  });

  it("falls back to yesterday so the app doesn't go neutral every morning", () => {
    const mood = computeMood([entry("2026-11-16", -4)], today);
    expect(mood?.source).toBe("yesterday");
    expect(mood?.level.key).toBe("slipping");
  });

  it("is null (neutral theme) without recent entries", () => {
    expect(computeMood([entry("2026-11-10", 5)], today)).toBeNull();
    expect(computeMood([], today)).toBeNull();
  });
});
