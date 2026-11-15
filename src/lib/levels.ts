/**
 * The 5-level system. Gemini scores -10..10; the UI turns scores into levels.
 * Every face, color, chart segment and calendar day uses this.
 */

export type LevelKey = "soaring" | "rising" | "steady" | "slipping" | "falling";

export interface Level {
  key: LevelKey;
  /** "Soaring" */
  name: string;
  /** Inclusive lower bound (scores are compared after rounding to 2 decimals). */
  min: number;
  /** "var(--level-soaring)" */
  colorVar: string;
  /** Contrast-safe variant for text on cards. */
  textColorVar: string;
  /** 4 = soaring ... 0 = falling (for the chart Y axis). */
  order: number;
  /** Human range, e.g. "+7 to +10". */
  range: string;
}

function level(key: LevelKey, name: string, min: number, order: number, range: string): Level {
  return {
    key,
    name,
    min,
    order,
    range,
    colorVar: `var(--level-${key})`,
    textColorVar: `var(--level-${key}-text)`,
  };
}

/** Ordered high to low. */
export const LEVELS: Level[] = [
  level("soaring", "Soaring", 7, 4, "+7 to +10"),
  level("rising", "Rising", 3, 3, "+3 to +6.99"),
  level("steady", "Steady", -2.99, 2, "−2.99 to +2.99"),
  level("slipping", "Slipping", -6.99, 1, "−6.99 to −3"),
  level("falling", "Falling", -Infinity, 0, "−10 to −7"),
];

/** Score values where the level changes (used to split chart lines). */
export const LEVEL_BOUNDARIES = [7, 3, -3, -7] as const;

const BY_KEY = Object.fromEntries(LEVELS.map((l) => [l.key, l])) as Record<LevelKey, Level>;

export function getLevel(key: LevelKey): Level {
  return BY_KEY[key];
}

export function scoreToLevel(score: number): Level {
  // Round to 2 decimals so averages like -2.995 behave predictably and float noise is ignored.
  const s = Math.round(score * 100) / 100;
  for (const l of LEVELS) {
    if (s >= l.min) return l;
  }
  return LEVELS[LEVELS.length - 1]!;
}

const MIDPOINTS: Record<LevelKey, number> = {
  soaring: 8.5,
  rising: 5,
  steady: 0,
  slipping: -5,
  falling: -8.5,
};

/** A representative score for each level (for plotting faces on the Y axis). */
export function levelMidpoint(key: LevelKey): number {
  return MIDPOINTS[key];
}

export function isLevelKey(value: unknown): value is LevelKey {
  return typeof value === "string" && value in BY_KEY;
}
