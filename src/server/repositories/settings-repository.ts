import "server-only";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { settingsPatchSchema } from "@/lib/schemas";
import { collection } from "@/server/db/mongo";
import type { Settings } from "@/types";

/** One document per user; `_id` is the Clerk user id. */
interface SettingsDoc {
  _id: string;
  settings: Settings;
}

const settingsCollection = () => collection<SettingsDoc>("settings");

/** Fill missing or invalid fields with defaults, field by field. */
export function normalizeSettings(raw: unknown): Settings {
  const obj = (raw && typeof raw === "object" ? (raw as { settings?: unknown }).settings : undefined) ?? {};
  const out: Settings = { ...DEFAULT_SETTINGS, timeOfDayStarts: { ...DEFAULT_SETTINGS.timeOfDayStarts } };
  const shape = settingsPatchSchema.shape;
  const src = obj as Record<string, unknown>;
  for (const key of Object.keys(shape) as (keyof Settings)[]) {
    const r = shape[key].safeParse(src[key]);
    if (r.success && r.data !== undefined) (out as unknown as Record<string, unknown>)[key] = r.data;
  }
  return out;
}

export const settingsRepository = {
  async get(userId: string): Promise<Settings> {
    return normalizeSettings(await (await settingsCollection()).findOne({ _id: userId }));
  },

  async update(userId: string, patch: Partial<Settings>): Promise<Settings> {
    const col = await settingsCollection();
    const current = normalizeSettings(await col.findOne({ _id: userId }));
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const next = normalizeSettings({ settings: { ...current, ...defined } });
    await col.replaceOne({ _id: userId }, { settings: next }, { upsert: true });
    return next;
  },

  async reset(userId: string): Promise<Settings> {
    await (await settingsCollection()).deleteOne({ _id: userId });
    return DEFAULT_SETTINGS;
  },
};
