import "server-only";
import { PROMPT_FEELING_COUNT, WEEKLY_MIN_ENTRIES, WEEKLY_REFRESH_COOLDOWN_MS } from "@/lib/constants";
import { feelingPatterns } from "@/lib/stats/feelings";
import { generateStructured } from "@/lib/ai/generate";
import { buildWeeklyPrompt, WEEKLY_RESPONSE_SCHEMA, WEEKLY_SYSTEM_INSTRUCTION } from "@/lib/gemini/weekly-prompt";
import { weeklyResultSchema } from "@/lib/schemas";
import { shiftDayKey } from "@/lib/utils/date";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http";
import { entriesRepository } from "@/server/repositories/entries-repository";
import { goalsRepository } from "@/server/repositories/goals-repository";
import { insightsRepository } from "@/server/repositories/insights-repository";
import { dayKeyInZone } from "@/server/timezone";
import type { Entry, WeeklyInsight } from "@/types";

export type WeeklyResult = { insight: WeeklyInsight; reason?: undefined } | { insight: null; reason: "not_enough_entries" };

async function weekEntries(userId: string, weekStart: string, tz: string): Promise<{ day: string; entry: Entry }[]> {
  const weekEnd = shiftDayKey(weekStart, 6);
  // Fetch a padded window, then filter precisely by local day in the user's zone.
  const all = await entriesRepository.list(userId, {
    from: new Date(Date.parse(`${weekStart}T00:00:00Z`) - 2 * 86_400_000).toISOString(),
    to: new Date(Date.parse(`${weekEnd}T00:00:00Z`) + 3 * 86_400_000).toISOString(),
  });
  return all
    .map((entry) => ({ day: dayKeyInZone(entry.createdAt, tz), entry }))
    .filter(({ day }) => day >= weekStart && day <= weekEnd);
}

/** Best and hardest day by average, computed from the data (Gemini's numbers are not trusted). */
export function bestAndHardDays(items: { day: string; entry: Entry }[]) {
  const byDay = new Map<string, number[]>();
  for (const { day, entry } of items) byDay.set(day, [...(byDay.get(day) ?? []), entry.score]);
  const days = [...byDay.entries()].map(([day, s]) => ({
    day,
    average: Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10,
  }));
  if (days.length === 0) return { bestDay: null, hardDay: null };
  const sorted = [...days].sort((a, b) => b.average - a.average || a.day.localeCompare(b.day));
  const best = sorted[0]!;
  const hard = sorted[sorted.length - 1]!;
  return {
    bestDay: best,
    hardDay: days.length > 1 && hard.average < best.average ? hard : null,
  };
}

async function generate(userId: string, weekStart: string, items: { day: string; entry: Entry }[]): Promise<WeeklyInsight> {
  const env = getEnv();
  const goals = await goalsRepository.list(userId);
  const patterns = feelingPatterns(await entriesRepository.list(userId), PROMPT_FEELING_COUNT);
  const { data: raw } = await generateStructured({
    apiKey: env.geminiApiKey,
    model: env.geminiModel,
    systemInstruction: WEEKLY_SYSTEM_INSTRUCTION,
    prompt: buildWeeklyPrompt({ goals, entries: items, patterns }),
    responseSchema: WEEKLY_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
  });
  const parsed = weeklyResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("Gemini's weekly read was not in the expected shape. Try again.", 502, "gemini_bad_shape");
  }
  const { bestDay, hardDay } = bestAndHardDays(items);
  return insightsRepository.saveWeekly(userId, {
    weekStart,
    headline: parsed.data.headline,
    suggestion: parsed.data.suggestion,
    bestDay,
    hardDay,
    generatedAt: new Date().toISOString(),
    entryCount: items.length,
  });
}

/** Cached insight for a week; generated once on first request when the week has enough updates. */
export async function getWeeklyInsight(userId: string, weekStart: string, tz: string): Promise<WeeklyResult> {
  const cached = await insightsRepository.getWeekly(userId, weekStart);
  if (cached) return { insight: cached };
  const items = await weekEntries(userId, weekStart, tz);
  if (items.length < WEEKLY_MIN_ENTRIES) return { insight: null, reason: "not_enough_entries" };
  return { insight: await generate(userId, weekStart, items) };
}

/** Regenerate, at most once per 10 minutes per week. */
export async function regenerateWeeklyInsight(userId: string, weekStart: string, tz: string): Promise<WeeklyInsight> {
  const cached = await insightsRepository.getWeekly(userId, weekStart);
  if (cached) {
    const wait = Date.parse(cached.generatedAt) + WEEKLY_REFRESH_COOLDOWN_MS - Date.now();
    if (wait > 0) {
      const minutes = Math.ceil(wait / 60_000);
      throw new AppError(
        `You just refreshed this week. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        429,
        "insight_cooldown",
      );
    }
  }
  const items = await weekEntries(userId, weekStart, tz);
  if (items.length < WEEKLY_MIN_ENTRIES) {
    throw new AppError(
      `Log at least ${WEEKLY_MIN_ENTRIES} updates this week to get your weekly read.`,
      422,
      "not_enough_entries",
    );
  }
  return generate(userId, weekStart, items);
}
