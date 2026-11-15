import { describe, expect, it } from "vitest";
import { computeStreaks } from "@/lib/stats/streaks";

const TODAY = "2026-11-07";

describe("computeStreaks", () => {
  it("is all zero with no days", () => {
    const r = computeStreaks([], TODAY);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(0);
    expect(r.atRisk).toBe(false);
    expect(r.lastFiveDays.map((d) => d.day)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
  });

  it("counts back from today when today is logged", () => {
    const r = computeStreaks(["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-07"], TODAY);
    expect(r.current).toBe(3);
    expect(r.atRisk).toBe(false);
    expect(r.lastFiveDays.at(-1)).toEqual({ day: TODAY, logged: true });
  });

  it("keeps the chain from yesterday when today is still open (at risk)", () => {
    const r = computeStreaks(["2026-11-04", "2026-11-05", "2026-11-06"], TODAY);
    expect(r.current).toBe(3);
    expect(r.atRisk).toBe(true);
    expect(r.lastFiveDays.at(-1)).toEqual({ day: "2026-11-06", logged: true });
  });

  it("breaks the chain after a missed day", () => {
    const r = computeStreaks(["2026-11-01", "2026-11-02", "2026-11-05"], TODAY);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(2);
  });

  it("finds the longest chain across months and in any order", () => {
    const days = ["2026-10-30", "2026-11-01", "2026-10-31", "2026-10-29", "2026-11-06", "2026-11-07"];
    const r = computeStreaks(days, TODAY);
    expect(r.longest).toBe(4);
    expect(r.current).toBe(2);
  });

  it("ignores future days for the longest chain", () => {
    const r = computeStreaks(["2026-11-08", "2026-11-09", "2026-11-10"], TODAY);
    expect(r.longest).toBe(0);
  });
});
