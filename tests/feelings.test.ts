import { describe, expect, it } from "vitest";
import { feelingPatterns } from "@/lib/stats/feelings";
import { feelingsSchema } from "@/lib/schemas";
import { buildPrompt, formatPatterns } from "@/lib/gemini/prompt";
import { entry } from "./fixtures";

describe("feelingPatterns", () => {
  it("groups case-insensitively, ranks by count, averages scores", () => {
    const p = feelingPatterns([
      entry("2026-11-01", 6, { boosts: ["Morning run"], drains: ["Doomscrolling"] }),
      entry("2026-11-02", 4, { boosts: ["morning run", "Talking to a friend"] }),
      entry("2026-11-03", -2, { drains: ["doomscrolling"] }),
    ]);
    expect(p.boosts[0]).toMatchObject({ count: 2, average: 5 });
    expect(p.boosts).toHaveLength(2);
    expect(p.drains).toEqual([{ label: "doomscrolling", count: 2, average: 2 }]);
  });
  it("honors the limit", () => {
    const p = feelingPatterns([entry("2026-11-01", 1, { boosts: ["a", "b", "c"] })], 2);
    expect(p.boosts).toHaveLength(2);
  });
});

describe("feelingsSchema", () => {
  it("trims, dedupes, caps at 3 and ignores junk", () => {
    expect(feelingsSchema.parse([" Run ", "run", 5, "", "a", "b", "c"])).toEqual(["Run", "a", "b"]);
    expect(feelingsSchema.parse("nope")).toEqual([]);
  });
});

describe("prompt", () => {
  const base = { update: "x", goals: [], recent: [], timeOfDay: "morning" as const, localTimestamp: "t", existingTags: [] };
  it("includes boosts, drains and patterns only when present", () => {
    const plain = buildPrompt(base);
    expect(plain).not.toContain("MOTIVATION");
    expect(plain).not.toContain("PATTERNS");
    const rich = buildPrompt({ ...base, boosts: ["a run"], drains: ["no sleep"], patterns: { boosts: [{ label: "a run", count: 3, average: 5 }], drains: [] } });
    expect(rich).toContain("- a run");
    expect(rich).toContain("- no sleep");
    expect(rich).toContain("PATTERNS THEY TOLD YOU");
    expect(formatPatterns({ boosts: [], drains: [] })).toBe("");
  });
});
