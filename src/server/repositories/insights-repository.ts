import "server-only";
import { collection } from "@/server/db/mongo";
import type { WeeklyInsight } from "@/types";

/** One document per user per week. */
type InsightDoc = WeeklyInsight & { userId: string };

const insights = () => collection<InsightDoc>("insights");

function isInsight(v: unknown): v is WeeklyInsight {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.weekStart === "string" && typeof o.headline === "string" && typeof o.generatedAt === "string";
}

function fromDoc(doc: unknown): WeeklyInsight | null {
  if (!isInsight(doc)) return null;
  return {
    weekStart: doc.weekStart,
    headline: doc.headline,
    bestDay: doc.bestDay ?? null,
    hardDay: doc.hardDay ?? null,
    suggestion: doc.suggestion ?? "",
    generatedAt: doc.generatedAt,
    entryCount: doc.entryCount ?? 0,
  };
}

export const insightsRepository = {
  async getWeekly(userId: string, weekStart: string): Promise<WeeklyInsight | null> {
    return fromDoc(await (await insights()).findOne({ userId, weekStart }));
  },

  async saveWeekly(userId: string, insight: WeeklyInsight): Promise<WeeklyInsight> {
    await (await insights()).replaceOne(
      { userId, weekStart: insight.weekStart },
      { ...insight, userId },
      { upsert: true },
    );
    return insight;
  },

  async clear(userId: string): Promise<void> {
    await (await insights()).deleteMany({ userId });
  },
};
