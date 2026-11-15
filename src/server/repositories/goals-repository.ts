import "server-only";
import { MAX_GOAL_TITLE, MAX_GOALS } from "@/lib/constants";
import { goalSchema } from "@/lib/schemas";
import { collection } from "@/server/db/mongo";
import type { Goal } from "@/types";

/** One document per user; `_id` is the Clerk user id. */
interface GoalsDoc {
  _id: string;
  goals: Goal[];
  updatedAt: string | null;
}

interface GoalsFile {
  goals: Goal[];
  updatedAt: string | null;
}

const goalsCollection = () => collection<GoalsDoc>("goals");

/** Old format: { text: "1. Run\n2. Get users" } → one goal per non-empty line. */
export function goalsFromText(text: string): Goal[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, MAX_GOALS)
    // Stable ids so repeated reads of an unmigrated record agree with each other.
    .map((title, order) => ({ id: `legacy-${order + 1}`, title: title.slice(0, MAX_GOAL_TITLE), target: "", icon: "target", order }));
}

export function normalizeGoalsFile(raw: unknown): GoalsFile {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const updatedAt = typeof obj.updatedAt === "string" ? obj.updatedAt : null;

  let goals: Goal[] = [];
  if (Array.isArray(obj.goals)) {
    goals = obj.goals
      .map((g) => goalSchema.safeParse(g))
      .filter((r) => r.success)
      .map((r) => r.data);
  } else if (typeof obj.text === "string") {
    goals = goalsFromText(obj.text);
  }

  goals = goals
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_GOALS)
    .map((g, i) => ({ ...g, order: i }));
  return { goals, updatedAt };
}

export const goalsRepository = {
  async list(userId: string): Promise<Goal[]> {
    const doc = await (await goalsCollection()).findOne({ _id: userId });
    return normalizeGoalsFile(doc).goals;
  },

  async save(userId: string, goals: Goal[]): Promise<Goal[]> {
    const next = normalizeGoalsFile({ goals, updatedAt: new Date().toISOString() });
    await (await goalsCollection()).replaceOne({ _id: userId }, next, { upsert: true });
    return next.goals;
  },
};
