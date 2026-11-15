import { describe, expect, it } from "vitest";
import { LEVELS, levelMidpoint, scoreToLevel } from "@/lib/levels";

describe("scoreToLevel", () => {
  const cases: [number, string][] = [
    [-10, "falling"],
    [-7, "falling"],
    [-6.99, "slipping"],
    [-3, "slipping"],
    [-2.99, "steady"],
    [0, "steady"],
    [2.99, "steady"],
    [3, "rising"],
    [6.99, "rising"],
    [7, "soaring"],
    [10, "soaring"],
  ];
  it.each(cases)("%s → %s", (score, key) => {
    expect(scoreToLevel(score).key).toBe(key);
  });

  it("handles float noise from averages", () => {
    expect(scoreToLevel((2 + 4) / 2).key).toBe("rising"); // 3
    expect(scoreToLevel(0.1 + 0.2 + 2.7).key).toBe("rising"); // 3.0000000000000004
    expect(scoreToLevel(-3.0000000001).key).toBe("slipping");
  });

  it("clamps out-of-range scores to the end levels", () => {
    expect(scoreToLevel(-50).key).toBe("falling");
    expect(scoreToLevel(50).key).toBe("soaring");
  });
});

describe("LEVELS", () => {
  it("is ordered high to low with descending order numbers", () => {
    expect(LEVELS.map((l) => l.order)).toEqual([4, 3, 2, 1, 0]);
    expect(LEVELS.map((l) => l.key)).toEqual(["soaring", "rising", "steady", "slipping", "falling"]);
  });

  it("uses CSS variables for color", () => {
    expect(LEVELS[0]!.colorVar).toBe("var(--level-soaring)");
  });

  it("midpoints fall inside their own level", () => {
    for (const l of LEVELS) expect(scoreToLevel(levelMidpoint(l.key)).key).toBe(l.key);
  });
});
