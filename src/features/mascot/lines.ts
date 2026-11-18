import type { LevelKey } from "@/lib/levels";
import type { TimeOfDay } from "@/types";

/** What Rumbo says, by level. Playful, never mean. */
export const LINES: Record<LevelKey, string[]> = {
  soaring: [
    "Look at you go!",
    "Today's on fire 🔥",
    "Screenshot this day.",
    "Good job!",
    "Big rumbo energy!",
    "Is this a highlight reel?",
    "Keep riding this one!",
    "Wow. Just wow.",
  ],
  rising: [
    "Nice direction!",
    "Up and to the right.",
    "Keep that rumbo.",
    "Good job!",
    "Little wins add up!",
    "You're climbing!",
    "That's the way!",
  ],
  steady: [
    "Holding the line.",
    "Steady wins too.",
    "One small push?",
    "Calm and on course.",
    "Easy does it.",
    "A quiet day counts.",
  ],
  slipping: [
    "Hey, it happens.",
    "What's one easy win?",
    "Let's turn this around.",
    "Small step, then another.",
    "Wobbly, not broken.",
    "Shake it off with me?",
  ],
  falling: [
    "Rough one. I'm here.",
    "Tomorrow's a new rumbo.",
    "Be kind to yourself today.",
    "Rest is progress too.",
    "Big hug. Then water.",
    "We'll bounce back.",
  ],
};

/** Nudges when nothing is logged yet, by part of the day. */
export const EMPTY_LINES: Record<TimeOfDay, string[]> = {
  morning: ["Start your day with water. One glass will energize you!", "Morning! What's the plan?", "Fresh day, fresh rumbo!"],
  noon: ["Halfway there! How's it going?", "Lunch break update?", "Quick check-in?"],
  afternoon: ["Afternoon slump? Tell me about it.", "What moved today?", "One update before dinner?"],
  night: ["How did today go?", "Wind down with a quick update.", "Tell me before bed!"],
};

export const THINKING_LINES = ["Hmm, let me see…", "Reading your day…", "Checking your goals…", "Almost there…"];

/** A stable pick (same seed → same line), so server and browser render the same text. */
export function pickLine(lines: readonly string[], seed: string): string {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return lines[Math.abs(h) % lines.length]!;
}
