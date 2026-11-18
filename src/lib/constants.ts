import type { Settings, TimeOfDay } from "@/types";

export const APP_NAME = "Rumbodia";
export const APP_VERSION = "1.0.0";
export const TAGLINE = "Which way is your day going?";

export const SCORE_MIN = -10;
export const SCORE_MAX = 10;

export const MAX_UPDATE_LENGTH = 4000;
export const MAX_GOALS = 10;
export const MAX_GOAL_TITLE = 80;
export const MAX_GOAL_TARGET = 80;
export const MAX_TAGS = 4;
export const MAX_TAG_LENGTH = 24;
/** "What moved you" phrases per update (per kind) and their length. */
export const MAX_FEELINGS = 3;
export const MAX_FEELING_LENGTH = 80;
/** How many recurring boosters/drains go into a Gemini prompt. */
export const PROMPT_FEELING_COUNT = 5;
/** How many existing tags are sent to Gemini so it can reuse them. */
export const PROMPT_TAG_COUNT = 30;

/** How many earlier updates are sent to Gemini as context. */
export const CONTEXT_ENTRY_COUNT = 5;

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const GEMINI_TIMEOUT_MS = 45_000;

/** Backfilled entries may not be later than now + this. */
export const FUTURE_TOLERANCE_MS = 5 * 60_000;

/** Weekly insight: minimum entries in a week, and minimum time between regenerations. */
export const WEEKLY_MIN_ENTRIES = 3;
export const WEEKLY_REFRESH_COOLDOWN_MS = 10 * 60_000;

export const TIMES_OF_DAY: TimeOfDay[] = ["morning", "noon", "afternoon", "night"];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  noon: "Noon",
  afternoon: "Afternoon",
  night: "Night",
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  weekStartsOn: 1,
  timeOfDayStarts: { morning: "05:00", noon: "11:00", afternoon: "14:00", night: "18:00" },
  scoreDisplay: "numbers",
  followMood: true,
  mascotMotion: "on",
};

/** Allowed goal icons (lucide names). The UI maps these to components. */
export const GOAL_ICONS = [
  "target",
  "dumbbell",
  "footprints",
  "briefcase",
  "users",
  "book-open",
  "graduation-cap",
  "brain",
  "heart",
  "moon",
  "wallet",
  "code",
  "music",
  "leaf",
  "coffee",
  "sprout",
] as const;

export type GoalIconName = (typeof GOAL_ICONS)[number];

export const DRAFT_STORAGE_KEY = "rumbodia:draft";
export const THEME_STORAGE_KEY = "rumbodia:theme";
