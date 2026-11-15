import { describe, expect, it } from "vitest";
import { buildDaySeries, buildWeeklySeries, seriesTrend, splitByLevel, splitRuns } from "@/lib/stats/series";
import { tagImpact } from "@/lib/stats/tag-impact";
import { timeOfDayCaption, timeOfDayStats } from "@/lib/stats/time-of-day";
import { calendarGrid, monthDayKeys, timeOfDayFromMinutes, weekStartOf } from "@/lib/utils/date";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { continueNumberedList } from "@/features/new-update/components/numbered-list";
import { entry } from "./fixtures";

describe("buildDaySeries", () => {
  it("averages per local day and leaves gaps as null", () => {
    const entries = [entry("2026-11-01", 4), entry("2026-11-01", 2, {}, "23:30"), entry("2026-11-03", -6)];
    const s = buildDaySeries(entries, ["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(s).toEqual([
      { day: "2026-11-01", average: 3, count: 2 },
      { day: "2026-11-02", average: null, count: 0 },
      { day: "2026-11-03", average: -6, count: 1 },
    ]);
  });
});

describe("buildWeeklySeries", () => {
  it("buckets by week start", () => {
    const entries = [entry("2026-11-02", 2), entry("2026-11-08", 4), entry("2026-11-09", -2)];
    const s = buildWeeklySeries(entries, "2026-11-02", "2026-11-15", 1);
    expect(s).toEqual([
      { day: "2026-11-02", average: 3, count: 2 },
      { day: "2026-11-09", average: -2, count: 1 },
    ]);
  });
});

describe("splitRuns", () => {
  it("breaks the line on null and keeps isolated points", () => {
    expect(splitRuns([1, 2, null, 5, null, null, 3, 4])).toEqual([
      [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ],
      [{ x: 3, y: 5 }],
      [
        { x: 6, y: 3 },
        { x: 7, y: 4 },
      ],
    ]);
  });
});

describe("splitByLevel", () => {
  it("keeps a run inside one level as one segment", () => {
    const segs = splitByLevel([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: -1 },
    ]);
    expect(segs).toHaveLength(1);
    expect(segs[0]!.level).toBe("steady");
    expect(segs[0]!.points).toHaveLength(3);
  });

  it("splits at every boundary crossed, at the exact intersection", () => {
    const segs = splitByLevel([
      { x: 0, y: -8 },
      { x: 1, y: 8 },
    ]);
    expect(segs.map((s) => s.level)).toEqual(["falling", "slipping", "steady", "rising", "soaring"]);
    // -8 → 8 crosses -7 at x = 1/16
    expect(segs[0]!.points[1]!.x).toBeCloseTo(1 / 16);
    expect(segs[0]!.points[1]!.y).toBe(-7);
    // Segments connect end to start.
    for (let i = 1; i < segs.length; i++) expect(segs[i]!.points[0]).toEqual(segs[i - 1]!.points.at(-1));
  });

  it("splits a descending line in travel order", () => {
    const segs = splitByLevel([
      { x: 0, y: 5 },
      { x: 2, y: -5 },
    ]);
    expect(segs.map((s) => s.level)).toEqual(["rising", "steady", "slipping"]);
    expect(segs[1]!.points[0]!.x).toBeCloseTo(0.4);
    expect(segs[1]!.points[1]!.x).toBeCloseTo(1.6);
  });

  it("returns a single point for a one-point run", () => {
    expect(splitByLevel([{ x: 3, y: 9 }])).toEqual([{ level: "soaring", points: [{ x: 3, y: 9 }] }]);
  });
});

describe("tagImpact", () => {
  it("averages per tag, highest first", () => {
    const rows = tagImpact([
      entry("2026-11-01", 6, { tags: ["exercise", "health"] }),
      entry("2026-11-02", 2, { tags: ["exercise"] }),
      entry("2026-11-02", -4, { tags: ["users"] }),
    ]);
    expect(rows).toEqual([
      { tag: "health", average: 6, count: 1 },
      { tag: "exercise", average: 4, count: 2 },
      { tag: "users", average: -4, count: 1 },
    ]);
  });
});

describe("timeOfDay", () => {
  const starts = DEFAULT_SETTINGS.timeOfDayStarts;
  it.each([
    ["04:59", "night"],
    ["05:00", "morning"],
    ["10:59", "morning"],
    ["11:00", "noon"],
    ["13:59", "noon"],
    ["14:00", "afternoon"],
    ["17:59", "afternoon"],
    ["18:00", "night"],
    ["00:00", "night"],
  ])("%s → %s", (hhmm, part) => {
    const [h, m] = hhmm.split(":").map(Number) as [number, number];
    expect(timeOfDayFromMinutes(h * 60 + m, starts)).toBe(part);
  });

  it("names the strongest part of the day", () => {
    const stats = timeOfDayStats([
      entry("2026-11-01", 6, { timeOfDay: "morning" }),
      entry("2026-11-01", -2, { timeOfDay: "night" }),
    ]);
    expect(timeOfDayCaption(stats)).toBe("Your mornings are your strongest time.");
    expect(stats.find((s) => s.part === "noon")).toEqual({ part: "noon", average: null, count: 0 });
  });
});

describe("calendar helpers", () => {
  it("weekStartOf respects Monday and Sunday starts", () => {
    // 2026-11-04 is a Wednesday.
    expect(weekStartOf("2026-11-04", 1)).toBe("2026-11-02");
    expect(weekStartOf("2026-11-04", 0)).toBe("2026-11-01");
    expect(weekStartOf("2026-11-01", 1)).toBe("2026-10-26");
  });

  it("calendarGrid covers whole weeks", () => {
    const grid = calendarGrid("2026-11", 1);
    expect(grid.length % 7).toBe(0);
    expect(grid[0]).toEqual({ day: "2026-10-26", inMonth: false });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30);
    expect(monthDayKeys("2028-02")).toHaveLength(29);
  });
});

describe("continueNumberedList", () => {
  it("continues a numbered list", () => {
    const v = "1. Ran 1 km";
    expect(continueNumberedList(v, v.length)).toEqual({ value: "1. Ran 1 km\n2. ", caret: v.length + 4 });
  });
  it("ends the list on an empty item", () => {
    const v = "1. Ran\n2. ";
    expect(continueNumberedList(v, v.length)).toEqual({ value: "1. Ran\n", caret: 7 });
  });
  it("ignores lines that are not numbered", () => {
    expect(continueNumberedList("hello", 5)).toBeNull();
  });
});

describe("seriesTrend", () => {
  const pts = (vals: (number | null)[]) => vals.map((v, i) => ({ day: `2026-11-${String(i + 1).padStart(2, "0")}`, average: v, count: v === null ? 0 : 1 }));

  it("needs three logged days", () => {
    expect(seriesTrend(pts([1, null, 5]))).toBeNull();
  });
  it("reads rising, falling and flat months", () => {
    expect(seriesTrend(pts([-4, null, 0, 2, 6]))!.direction).toBe("up");
    expect(seriesTrend(pts([6, 3, null, -2]))!.direction).toBe("down");
    expect(seriesTrend(pts([2, 3, 2, 2.5]))!.direction).toBe("flat");
  });
});
