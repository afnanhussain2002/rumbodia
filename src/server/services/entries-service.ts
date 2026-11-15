import "server-only";
import { randomUUID } from "node:crypto";
import { CONTEXT_ENTRY_COUNT, FUTURE_TOLERANCE_MS, PROMPT_FEELING_COUNT, PROMPT_TAG_COUNT } from "@/lib/constants";
import { feelingPatterns } from "@/lib/stats/feelings";
import type { CreateEntryInput, PatchEntryInput } from "@/lib/schemas";
import { AppError } from "@/server/http";
import { entriesRepository } from "@/server/repositories/entries-repository";
import { goalsRepository } from "@/server/repositories/goals-repository";
import { settingsRepository } from "@/server/repositories/settings-repository";
import { analyzeUpdate } from "@/server/services/analysis-service";
import { formatLocalTimestamp, timeOfDayInZone } from "@/server/timezone";
import type { Entry, TimeOfDay } from "@/types";

function resolveCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return new Date().toISOString();
  const t = Date.parse(createdAt);
  if (t > Date.now() + FUTURE_TOLERANCE_MS) {
    throw new AppError("That time is in the future. Pick now or an earlier time.", 400, "future_timestamp");
  }
  return new Date(t).toISOString();
}

interface Feelings {
  boosts: string[];
  drains: string[];
}

async function score(userId: string, text: string, createdAt: string, timeOfDay: TimeOfDay, tz: string, feelings: Feelings, excludeId?: string) {
  const [goals, recent, tags, all] = await Promise.all([
    goalsRepository.list(userId),
    entriesRepository.listRecent(userId, CONTEXT_ENTRY_COUNT + 1, createdAt),
    entriesRepository.tags(userId),
    entriesRepository.list(userId),
  ]);

  return analyzeUpdate({
    update: text,
    goals,
    recent: recent.filter((e) => e.id !== excludeId).slice(-CONTEXT_ENTRY_COUNT),
    timeOfDay,
    localTimestamp: formatLocalTimestamp(createdAt, tz),
    existingTags: tags.slice(0, PROMPT_TAG_COUNT).map((t) => t.name),
    boosts: feelings.boosts,
    drains: feelings.drains,
    patterns: feelingPatterns(all.filter((e) => e.id !== excludeId), PROMPT_FEELING_COUNT),
  });
}

/**
 * Score a new update with Gemini, then save it.
 * If Gemini fails, nothing is saved, so the log never has unscored entries.
 */
export async function createEntry(userId: string, input: CreateEntryInput, tz: string): Promise<Entry> {
  const createdAt = resolveCreatedAt(input.createdAt);
  const settings = await settingsRepository.get(userId);
  const timeOfDay = input.timeOfDay ?? timeOfDayInZone(createdAt, tz, settings.timeOfDayStarts);

  const boosts = input.boosts ?? [];
  const drains = input.drains ?? [];
  const analysis = await score(userId, input.text, createdAt, timeOfDay, tz, { boosts, drains });

  return entriesRepository.create(userId, {
    id: randomUUID(),
    text: input.text,
    score: analysis.score,
    reason: analysis.reason,
    wins: analysis.wins,
    slips: analysis.slips,
    tags: analysis.tags,
    boosts,
    drains,
    timeOfDay,
    createdAt,
    updatedAt: null,
    model: analysis.model,
  });
}

/** Edit text/time. With `rescore`, Gemini scores the (new) text again; if it fails nothing changes. */
export async function updateEntry(userId: string, id: string, patch: PatchEntryInput, tz: string): Promise<Entry> {
  const current = await entriesRepository.get(userId, id);
  if (!current) throw new AppError("That update no longer exists.", 404, "not_found");

  const createdAt = patch.createdAt ? resolveCreatedAt(patch.createdAt) : current.createdAt;
  let timeOfDay = patch.timeOfDay ?? current.timeOfDay;
  if (patch.createdAt && !patch.timeOfDay && createdAt !== current.createdAt) {
    const settings = await settingsRepository.get(userId);
    timeOfDay = timeOfDayInZone(createdAt, tz, settings.timeOfDayStarts);
  }

  const next: Entry = {
    ...current,
    text: patch.text ?? current.text,
    createdAt,
    timeOfDay,
    boosts: patch.boosts ?? current.boosts,
    drains: patch.drains ?? current.drains,
    updatedAt: new Date().toISOString(),
  };

  if (patch.rescore) {
    const analysis = await score(userId, next.text, createdAt, timeOfDay, tz, { boosts: next.boosts, drains: next.drains }, id);
    Object.assign(next, {
      score: analysis.score,
      reason: analysis.reason,
      wins: analysis.wins,
      slips: analysis.slips,
      tags: analysis.tags,
      model: analysis.model,
    });
  }

  const saved = await entriesRepository.replace(userId, next);
  if (!saved) throw new AppError("That update no longer exists.", 404, "not_found");
  return saved;
}

export async function deleteEntry(userId: string, id: string): Promise<void> {
  const removed = await entriesRepository.remove(userId, id);
  if (!removed) throw new AppError("That update no longer exists.", 404, "not_found");
}

/** Put a deleted entry back exactly as it was (Undo). */
export async function restoreEntry(userId: string, entry: Entry): Promise<Entry> {
  return entriesRepository.upsert(userId, entry);
}
