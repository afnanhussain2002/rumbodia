import "server-only";
import { APP_VERSION } from "@/lib/constants";
import type { ImportInput } from "@/lib/schemas";
import { entriesToCsv } from "@/lib/utils/csv";
import { entriesRepository, normalizeEntry } from "@/server/repositories/entries-repository";
import { goalsRepository } from "@/server/repositories/goals-repository";
import { insightsRepository } from "@/server/repositories/insights-repository";
import { settingsRepository } from "@/server/repositories/settings-repository";
import type { Entry, ExportBundle } from "@/types";

export async function exportJson(userId: string): Promise<ExportBundle> {
  const [entries, goals, settings] = await Promise.all([
    entriesRepository.list(userId),
    goalsRepository.list(userId),
    settingsRepository.get(userId),
  ]);
  return { app: "rumbodia", version: 2, exportedAt: new Date().toISOString(), entries, goals, settings };
}

export async function exportCsv(userId: string): Promise<string> {
  return entriesToCsv(await entriesRepository.list(userId));
}

export async function importData(userId: string, { data, mode }: ImportInput): Promise<{ entries: number; goals: number }> {
  const entries = data.entries.map(normalizeEntry).filter((e): e is Entry => e !== null);

  if (mode === "replace") {
    await entriesRepository.replaceAll(userId, entries);
    await goalsRepository.save(userId, data.goals);
    await insightsRepository.clear(userId);
  } else {
    await entriesRepository.merge(userId, entries);
    if (data.goals.length) {
      const current = await goalsRepository.list(userId);
      const map = new Map(current.map((g) => [g.id, g]));
      for (const g of data.goals) map.set(g.id, { ...g, order: map.get(g.id)?.order ?? map.size });
      await goalsRepository.save(userId, [...map.values()].slice(0, 10));
    }
  }
  if (data.settings) await settingsRepository.update(userId, data.settings);
  return { entries: entries.length, goals: data.goals.length };
}

export async function deleteAllData(userId: string): Promise<void> {
  await Promise.all([
    entriesRepository.clear(userId),
    goalsRepository.save(userId, []),
    insightsRepository.clear(userId),
    settingsRepository.reset(userId),
  ]);
}

export function appVersion(): string {
  return APP_VERSION;
}
