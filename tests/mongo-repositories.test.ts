import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { entriesRepository } from "@/server/repositories/entries-repository";
import { goalsRepository } from "@/server/repositories/goals-repository";
import { insightsRepository } from "@/server/repositories/insights-repository";
import { settingsRepository } from "@/server/repositories/settings-repository";
import { getDb } from "@/server/db/mongo";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { entry } from "./fixtures";

/**
 * Talks to a real MongoDB, so it only runs when RUN_MONGO_TESTS=1 and MONGO_URI are set
 * (e.g. `RUN_MONGO_TESTS=1 node --env-file=.env node_modules/vitest/vitest.mjs run mongo`).
 * It uses a throwaway database and drops it afterwards, never your real one.
 */
const run = process.env.RUN_MONGO_TESTS && (process.env.MONGO_URI || process.env.MONGODB_URI) ? describe : describe.skip;

const A = "user_A";
const B = "user_B";

run("MongoDB repositories", () => {
  beforeAll(() => {
    process.env.MONGODB_DB = `rumbodia_test_${Date.now()}`;
  });

  afterAll(async () => {
    await (await getDb()).dropDatabase();
  });

  it("keeps each user's entries separate", async () => {
    const a1 = entry("2026-03-01", 5, { tags: ["work", "run"], text: "Shipped the Landing page" });
    const a2 = entry("2026-03-02", -3, { tags: ["work"] });
    const b1 = entry("2026-03-01", 8, { tags: ["family"] });
    await entriesRepository.create(A, a1);
    await entriesRepository.create(A, a2);
    await entriesRepository.create(B, b1);

    expect((await entriesRepository.list(A)).map((e) => e.id)).toEqual([a1.id, a2.id]);
    expect((await entriesRepository.list(B)).map((e) => e.id)).toEqual([b1.id]);
    expect(await entriesRepository.get(B, a1.id)).toBeNull();
    expect(await entriesRepository.remove(B, a1.id)).toBe(false);
    expect(await entriesRepository.replace(B, { ...a1, text: "hijack" })).toBeNull();
    expect((await entriesRepository.get(A, a1.id))?.text).toBe("Shipped the Landing page");
  });

  it("filters by range, tag and search, and returns clean entries", async () => {
    const all = await entriesRepository.list(A);
    expect(all[0]).not.toHaveProperty("_id");
    expect(all[0]).not.toHaveProperty("userId");

    expect(await entriesRepository.list(A, { tag: "run" })).toHaveLength(1);
    expect(await entriesRepository.list(A, { q: "landing PAGE" })).toHaveLength(1);
    expect(await entriesRepository.list(A, { q: "(" })).toHaveLength(0); // regex chars are escaped
    expect(await entriesRepository.list(A, { q: "wor" })).toHaveLength(2); // matches tags too
    expect(await entriesRepository.list(A, { from: all[1]!.createdAt })).toHaveLength(1);
    expect(await entriesRepository.list(A, { to: all[1]!.createdAt })).toHaveLength(1);
    expect(await entriesRepository.tags(A)).toEqual([
      { name: "work", count: 2 },
      { name: "run", count: 1 },
    ]);
  });

  it("lists recent entries oldest first", async () => {
    const all = await entriesRepository.list(A);
    expect((await entriesRepository.listRecent(A, 5)).map((e) => e.id)).toEqual(all.map((e) => e.id));
    expect((await entriesRepository.listRecent(A, 5, all[1]!.createdAt)).map((e) => e.id)).toEqual([all[0]!.id]);
  });

  it("replaces, upserts, merges and replaces all", async () => {
    const [first] = await entriesRepository.list(A);
    expect((await entriesRepository.replace(A, { ...first!, text: "edited" }))?.text).toBe("edited");

    const restored = entry("2026-03-05", 1);
    await entriesRepository.upsert(A, restored);
    await entriesRepository.upsert(A, { ...restored, text: "again" });
    expect((await entriesRepository.list(A)).filter((e) => e.id === restored.id)).toHaveLength(1);

    const extra = entry("2026-03-06", 2);
    expect(await entriesRepository.merge(A, [extra, { ...restored, text: "merged" }])).toBe(2);
    expect((await entriesRepository.get(A, restored.id))?.text).toBe("merged");

    await entriesRepository.replaceAll(A, [extra]);
    expect((await entriesRepository.list(A)).map((e) => e.id)).toEqual([extra.id]);
    expect(await entriesRepository.list(B)).toHaveLength(1); // untouched

    expect(await entriesRepository.remove(A, extra.id)).toBe(true);
    await entriesRepository.clear(B);
    expect(await entriesRepository.list(B)).toHaveLength(0);
  });

  it("stores goals per user", async () => {
    const goal = { id: "g1", title: "Run", target: "3x a week", icon: "target", order: 0 };
    expect(await goalsRepository.list(A)).toEqual([]);
    await goalsRepository.save(A, [goal]);
    expect(await goalsRepository.list(A)).toEqual([goal]);
    expect(await goalsRepository.list(B)).toEqual([]);
    await goalsRepository.save(A, []);
    expect(await goalsRepository.list(A)).toEqual([]);
  });

  it("stores settings per user and resets to defaults", async () => {
    expect(await settingsRepository.get(A)).toEqual(DEFAULT_SETTINGS);
    expect((await settingsRepository.update(A, { theme: "dark" })).theme).toBe("dark");
    expect((await settingsRepository.update(A, { scoreDisplay: "levels" })).theme).toBe("dark");
    expect((await settingsRepository.get(B)).theme).toBe(DEFAULT_SETTINGS.theme);
    expect(await settingsRepository.reset(A)).toEqual(DEFAULT_SETTINGS);
    expect(await settingsRepository.get(A)).toEqual(DEFAULT_SETTINGS);
  });

  it("caches weekly insights per user and week", async () => {
    const insight = {
      weekStart: "2026-03-02",
      headline: "Good week",
      bestDay: { day: "2026-03-03", average: 5 },
      hardDay: null,
      suggestion: "Keep going",
      generatedAt: new Date().toISOString(),
      entryCount: 4,
    };
    await insightsRepository.saveWeekly(A, insight);
    await insightsRepository.saveWeekly(A, { ...insight, headline: "Updated" });
    expect((await insightsRepository.getWeekly(A, "2026-03-02"))?.headline).toBe("Updated");
    expect(await insightsRepository.getWeekly(B, "2026-03-02")).toBeNull();
    await insightsRepository.clear(A);
    expect(await insightsRepository.getWeekly(A, "2026-03-02")).toBeNull();
  });
});
