import { describe, expect, it } from "vitest";
import {
  analysisResultSchema,
  createEntryInputSchema,
  deleteAllInputSchema,
  exportBundleSchema,
  goalSchema,
  settingsPatchSchema,
  updateGoalsInputSchema,
} from "@/lib/schemas";
import { goalsFromText, normalizeGoalsFile } from "@/server/repositories/goals-repository";
import { normalizeEntry } from "@/server/repositories/entries-repository";
import { normalizeSettings } from "@/server/repositories/settings-repository";
import { bestAndHardDays } from "@/server/services/insights-service";
import { entriesToCsv } from "@/lib/utils/csv";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { entry } from "./fixtures";

describe("analysisResultSchema", () => {
  it("clamps and rounds the score", () => {
    expect(analysisResultSchema.parse({ score: 14.6, reason: "x", wins: [], slips: [], tags: [] }).score).toBe(10);
    expect(analysisResultSchema.parse({ score: -3.4, reason: "x", wins: [], slips: [], tags: [] }).score).toBe(-3);
  });

  it("cleans tags: lowercase, trimmed, #-less, max 24 chars, deduplicated, max 4", () => {
    const r = analysisResultSchema.parse({
      score: 1,
      reason: "x",
      wins: [],
      slips: [],
      tags: [" Exercise ", "exercise", "#Customers", "a-very-very-long-tag-name-that-goes-on", "", 42, "sleep", "extra"],
    });
    expect(r.tags).toEqual(["exercise", "customers", "a-very-very-long-tag-nam", "sleep"]);
  });

  it("defaults missing tags to []", () => {
    expect(analysisResultSchema.parse({ score: 1, reason: "x" }).tags).toEqual([]);
  });

  it("rejects an empty reason", () => {
    expect(analysisResultSchema.safeParse({ score: 1, reason: " " }).success).toBe(false);
  });
});

describe("request schemas", () => {
  it("createEntryInput trims and requires text", () => {
    expect(createEntryInputSchema.safeParse({ text: "   " }).success).toBe(false);
    expect(createEntryInputSchema.parse({ text: " hi ", timeOfDay: "noon" })).toEqual({ text: "hi", timeOfDay: "noon" });
    expect(createEntryInputSchema.safeParse({ text: "hi", timeOfDay: "evening" }).success).toBe(false);
    expect(createEntryInputSchema.safeParse({ text: "hi", createdAt: "not a date" }).success).toBe(false);
  });

  it("goals: max 10, unknown icon falls back to target", () => {
    const goal = (i: number) => ({ id: `g${i}`, title: `Goal ${i}`, target: "", icon: "rocket", order: i });
    expect(goalSchema.parse(goal(0)).icon).toBe("target");
    expect(updateGoalsInputSchema.safeParse({ goals: Array.from({ length: 11 }, (_, i) => goal(i)) }).success).toBe(false);
    expect(goalSchema.safeParse({ ...goal(0), title: " " }).success).toBe(false);
  });

  it("settings patch validates times", () => {
    expect(settingsPatchSchema.safeParse({ timeOfDayStarts: { morning: "5:00", noon: "11:00", afternoon: "14:00", night: "18:00" } }).success).toBe(false);
    expect(settingsPatchSchema.parse({ weekStartsOn: 0 })).toEqual({ weekStartsOn: 0 });
  });

  it("delete-all needs the exact word", () => {
    expect(deleteAllInputSchema.safeParse({ confirm: "delete" }).success).toBe(false);
    expect(deleteAllInputSchema.safeParse({ confirm: "DELETE" }).success).toBe(true);
  });

  it("import bundle accepts an export and old entries", () => {
    const r = exportBundleSchema.parse({
      entries: [{ id: "a", text: "hi", score: 2, reason: "r", wins: [], slips: [], createdAt: "2026-11-04T04:48:53.412Z" }],
    });
    expect(r.entries[0]!.tags).toEqual([]);
    expect(r.goals).toEqual([]);
  });
});

describe("migrations (normalize on read)", () => {
  it("upgrades an old entry", () => {
    const old = {
      id: "c9bd",
      text: "1. Ran 1 km",
      score: 0,
      reason: "ok",
      wins: ["Ran 1 km"],
      slips: [],
      createdAt: "2026-11-04T14:48:53.412Z",
    };
    const e = normalizeEntry(old)!;
    expect(e.tags).toEqual([]);
    expect(e.updatedAt).toBeNull();
    expect(e.model).toBe("unknown");
    expect(["morning", "noon", "afternoon", "night"]).toContain(e.timeOfDay);
  });

  it("drops records that cannot be repaired", () => {
    expect(normalizeEntry({ id: "x" })).toBeNull();
  });

  it("splits old goals text into goals", () => {
    const goals = goalsFromText("1. Run 4 times a week\n\n- Get 10 users\n• Read daily\n");
    expect(goals.map((g) => g.title)).toEqual(["Run 4 times a week", "Get 10 users", "Read daily"]);
    expect(goals.map((g) => g.order)).toEqual([0, 1, 2]);
    // Stable ids across reads.
    expect(goalsFromText("Run").map((g) => g.id)).toEqual(goalsFromText("Run").map((g) => g.id));
  });

  it("reads an old goals.json file", () => {
    const file = normalizeGoalsFile({ text: "Run\nCode", updatedAt: null });
    expect(file.goals).toHaveLength(2);
  });

  it("fills missing settings with defaults field by field", () => {
    const s = normalizeSettings({ settings: { theme: "dark", weekStartsOn: 7 } });
    expect(s.theme).toBe("dark");
    expect(s.weekStartsOn).toBe(DEFAULT_SETTINGS.weekStartsOn);
    expect(s.timeOfDayStarts).toEqual(DEFAULT_SETTINGS.timeOfDayStarts);
  });
});

describe("weekly best/hard days", () => {
  it("computes from the data, not from Gemini", () => {
    const items = [
      { day: "2026-11-02", entry: entry("2026-11-02", 6) },
      { day: "2026-11-02", entry: entry("2026-11-02", 7) },
      { day: "2026-11-03", entry: entry("2026-11-03", -4) },
      { day: "2026-11-04", entry: entry("2026-11-04", 1) },
    ];
    expect(bestAndHardDays(items)).toEqual({
      bestDay: { day: "2026-11-02", average: 6.5 },
      hardDay: { day: "2026-11-03", average: -4 },
    });
  });

  it("has no hard day when only one day was logged", () => {
    const items = [{ day: "2026-11-02", entry: entry("2026-11-02", 6) }];
    expect(bestAndHardDays(items).hardDay).toBeNull();
  });
});

describe("csv", () => {
  it("quotes fields with commas, quotes and newlines", () => {
    const csv = entriesToCsv([entry("2026-11-02", 3, { text: '1. Ran, "fast"\n2. Slept', tags: ["a", "b"] })]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("id,createdAt,timeOfDay,score,text,reason,wins,slips,tags,boosts,drains,updatedAt,model");
    expect(csv).toContain('"1. Ran, ""fast""\n2. Slept"');
    expect(csv).toContain("a | b");
  });
});
