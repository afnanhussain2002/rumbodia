import { z } from "zod";
import {
  GOAL_ICONS,
  MAX_GOAL_TARGET,
  MAX_FEELING_LENGTH,
  MAX_FEELINGS,
  MAX_GOAL_TITLE,
  MAX_GOALS,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_UPDATE_LENGTH,
  SCORE_MAX,
  SCORE_MIN,
} from "@/lib/constants";

export const timeOfDaySchema = z.enum(["morning", "noon", "afternoon", "night"]);

const isoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Use a valid date and time.");
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a HH:MM time.");

const updateText = z
  .string()
  .trim()
  .min(1, "Write something first.")
  .max(MAX_UPDATE_LENGTH, `Keep updates under ${MAX_UPDATE_LENGTH} characters.`);

/** Lowercase, trimmed, max 24 chars each, deduplicated, max 4. Never fails on messy input. */
export const tagsSchema = z
  .array(z.unknown())
  .catch([])
  .transform((list) => {
    const seen = new Set<string>();
    for (const raw of list) {
      if (typeof raw !== "string") continue;
      const tag = raw.trim().toLowerCase().replace(/^#+/, "").replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH).trim();
      if (tag) seen.add(tag);
      if (seen.size >= MAX_TAGS) break;
    }
    return [...seen];
  });

/** "What moved you" phrases: trimmed, max 80 chars, deduplicated (case-insensitive), max 3. Never fails on messy input. */
export const feelingsSchema = z
  .array(z.unknown())
  .catch([])
  .transform((list) => {
    const seen = new Map<string, string>();
    for (const raw of list) {
      if (typeof raw !== "string") continue;
      const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_FEELING_LENGTH).trim();
      if (text && !seen.has(text.toLowerCase())) seen.set(text.toLowerCase(), text);
      if (seen.size >= MAX_FEELINGS) break;
    }
    return [...seen.values()];
  });

// ---------- Requests ----------

/** POST /api/entries */
export const createEntryInputSchema = z.object({
  text: updateText,
  timeOfDay: timeOfDaySchema.optional(),
  createdAt: isoDateTime.optional(),
  boosts: feelingsSchema.optional(),
  drains: feelingsSchema.optional(),
});

/** PATCH /api/entries/:id */
export const patchEntryInputSchema = z.object({
  text: updateText.optional(),
  timeOfDay: timeOfDaySchema.optional(),
  createdAt: isoDateTime.optional(),
  boosts: feelingsSchema.optional(),
  drains: feelingsSchema.optional(),
  rescore: z.boolean().optional(),
});

/** A full stored entry (restore + import). */
export const entrySchema = z.object({
  id: z.string().min(1).max(100),
  text: updateText,
  score: z.number().transform((n) => Math.min(SCORE_MAX, Math.max(SCORE_MIN, n))),
  reason: z.string().max(2000).default(""),
  wins: z.array(z.string()).max(10).default([]),
  slips: z.array(z.string()).max(10).default([]),
  tags: tagsSchema.default([]),
  boosts: feelingsSchema.default([]),
  drains: feelingsSchema.default([]),
  timeOfDay: timeOfDaySchema.optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime.nullable().default(null),
  model: z.string().max(100).default("unknown"),
});

export const goalSchema = z.object({
  id: z.string().min(1).max(100),
  title: z
    .string()
    .trim()
    .min(1, "Every goal needs a title.")
    .max(MAX_GOAL_TITLE, `Keep goal titles under ${MAX_GOAL_TITLE} characters.`),
  target: z.string().trim().max(MAX_GOAL_TARGET, `Keep targets under ${MAX_GOAL_TARGET} characters.`).default(""),
  icon: z.enum(GOAL_ICONS).catch("target"),
  order: z.number().int().min(0).default(0),
});

/** PUT /api/goals */
export const updateGoalsInputSchema = z.object({
  goals: z.array(goalSchema).max(MAX_GOALS, `You can have up to ${MAX_GOALS} goals.`),
});

export const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  timeOfDayStarts: z.object({ morning: hhmm, noon: hhmm, afternoon: hhmm, night: hhmm }),
  scoreDisplay: z.enum(["numbers", "levels"]),
});

/** PUT /api/settings */
export const settingsPatchSchema = settingsSchema.partial();

export const weekStartQuerySchema = z.object({ weekStart: dayKey });

export const listEntriesQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  tag: z.string().trim().toLowerCase().optional(),
  q: z.string().trim().max(200).optional(),
});

export const exportBundleSchema = z.object({
  app: z.literal("rumbodia").optional(),
  version: z.number().optional(),
  entries: z.array(entrySchema).default([]),
  goals: z.array(goalSchema).max(MAX_GOALS).default([]),
  settings: settingsPatchSchema.optional(),
});

/** POST /api/import */
export const importInputSchema = z.object({
  data: exportBundleSchema,
  mode: z.enum(["merge", "replace"]),
});

/** DELETE /api/data */
export const deleteAllInputSchema = z.object({
  confirm: z.literal("DELETE", { error: 'Type "DELETE" to confirm.' }),
});

// ---------- Gemini answers (validated, never trusted) ----------

export const analysisResultSchema = z.object({
  score: z.number().transform((n) => Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(n)))),
  reason: z.string().trim().min(1),
  wins: z.array(z.string().trim().min(1)).max(5).default([]),
  slips: z.array(z.string().trim().min(1)).max(5).default([]),
  tags: tagsSchema.default([]),
});

export const weeklyResultSchema = z.object({
  headline: z.string().trim().min(1),
  bestDay: z.string().nullable().optional(),
  hardDay: z.string().nullable().optional(),
  suggestion: z.string().trim().min(1),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type CreateEntryInput = z.infer<typeof createEntryInputSchema>;
export type PatchEntryInput = z.infer<typeof patchEntryInputSchema>;
export type ImportInput = z.infer<typeof importInputSchema>;
export type ExportBundleInput = z.infer<typeof exportBundleSchema>;
