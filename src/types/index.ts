/** Shared domain types. Used by both the server and the browser. */

export type TimeOfDay = "morning" | "noon" | "afternoon" | "night";

export interface Entry {
  id: string;
  /** What you wrote, exactly as you wrote it. */
  text: string;
  /** -10..10 (integer from Gemini). */
  score: number;
  /** One or two sentences from Gemini explaining the score. */
  reason: string;
  /** Short phrases for what went well. */
  wins: string[];
  /** Short phrases for what slipped. */
  slips: string[];
  /** 1–4 lowercase tags from Gemini. */
  tags: string[];
  /** Told by the user: what gave them motivation or confidence (0–3 short phrases). */
  boosts: string[];
  /** Told by the user: what lowered their motivation or confidence (0–3 short phrases). */
  drains: string[];
  timeOfDay: TimeOfDay;
  /** ISO 8601. May be in the past (backfill). */
  createdAt: string;
  updatedAt: string | null;
  /** Which Gemini model scored it. */
  model: string;
}

export interface Goal {
  id: string;
  /** "Run or work out" */
  title: string;
  /** "4 times a week" (may be empty) */
  target: string;
  /** lucide icon name from GOAL_ICONS */
  icon: string;
  order: number;
}

export interface TimeOfDayStarts {
  morning: string;
  noon: string;
  afternoon: string;
  night: string;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 | 1;
  /** "05:00" style local times */
  timeOfDayStarts: TimeOfDayStarts;
  scoreDisplay: "numbers" | "levels";
}

export interface WeeklyInsight {
  /** YYYY-MM-DD (local) */
  weekStart: string;
  headline: string;
  bestDay: { day: string; average: number } | null;
  hardDay: { day: string; average: number } | null;
  suggestion: string;
  generatedAt: string;
  entryCount: number;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface Meta {
  model: string;
  version: string;
}

/** One point on a chart: the average score of all entries in a bucket (a day or a week). */
export interface DailyPoint {
  /** Local date, YYYY-MM-DD. For weekly buckets, the week start. */
  day: string;
  average: number | null;
  count: number;
}

export interface ApiErrorBody {
  error: { message: string; code?: string };
}

export interface ExportBundle {
  app: "rumbodia";
  version: number;
  exportedAt: string;
  entries: Entry[];
  goals: Goal[];
  settings: Settings;
}
