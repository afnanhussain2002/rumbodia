import type { LevelKey } from "@/lib/levels";

/**
 * Rumbo's body per level, drawn on a 100×100 grid. Shape AND color carry the level,
 * so the level can be read without color (accessibility).
 *
 *   soaring  → rounded star       rising   → triangle pointing up
 *   steady   → circle             slipping → pentagon, tilted 10°
 *   falling  → droopy, melting square
 *
 * Polygons are drawn with a thick round-joined stroke in the body color, which rounds the corners.
 */
export interface RumboShape {
  d: string;
  /** Round-join stroke that softens the corners (same color as the fill). */
  stroke: number;
  /** Face anchor: eye line and mouth line. */
  eyeY: number;
  mouthY: number;
  /** Half the distance between the eyes. */
  eyeGap: number;
  /** Where arms attach (left x, right x, y). */
  arm: { lx: number; rx: number; y: number };
  /** Leg x positions and the y where they leave the body. Empty = no legs. */
  legs: { x: number[]; y: number };
  /** Small shine in the top-left. */
  gloss: { cx: number; cy: number; rx: number; ry: number; rotate: number } | null;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function polygon(sides: number, radius: number, cx: number, cy: number, rotateDeg = 0, innerRadius?: number): string {
  const points: string[] = [];
  const count = innerRadius ? sides * 2 : sides;
  for (let i = 0; i < count; i++) {
    const r = innerRadius && i % 2 === 1 ? innerRadius : radius;
    const a = ((-90 + rotateDeg) * Math.PI) / 180 + (i * 2 * Math.PI) / count;
    points.push(`${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`);
  }
  return `M${points.join(" L")} Z`;
}

export const SHAPES: Record<LevelKey, RumboShape> = {
  soaring: {
    d: polygon(5, 44, 50, 55, 0, 29),
    stroke: 12,
    eyeY: 52,
    mouthY: 62,
    eyeGap: 10,
    arm: { lx: 18, rx: 82, y: 44 },
    legs: { x: [31, 69], y: 90 },
    gloss: { cx: 40, cy: 36, rx: 5, ry: 3, rotate: -35 },
  },
  rising: {
    d: "M50 10 L91 84 L9 84 Z",
    stroke: 14,
    eyeY: 58,
    mouthY: 68,
    eyeGap: 10,
    arm: { lx: 24, rx: 76, y: 62 },
    legs: { x: [38, 62], y: 90 },
    gloss: { cx: 42, cy: 34, rx: 4, ry: 2.6, rotate: -60 },
  },
  steady: {
    d: "M50 10 C74 10 92 28 92 51 C92 75 74 92 50 92 C26 92 8 75 8 51 C8 28 26 10 50 10 Z",
    stroke: 0,
    eyeY: 48,
    mouthY: 61,
    eyeGap: 12,
    arm: { lx: 9, rx: 91, y: 58 },
    legs: { x: [38, 62], y: 90 },
    gloss: { cx: 28, cy: 28, rx: 7, ry: 4, rotate: -40 },
  },
  slipping: {
    d: polygon(5, 44, 50, 54, 10),
    stroke: 10,
    eyeY: 51,
    mouthY: 64,
    eyeGap: 11,
    arm: { lx: 12, rx: 88, y: 54 },
    legs: { x: [36, 62], y: 92 },
    gloss: { cx: 34, cy: 30, rx: 6, ry: 3.4, rotate: -25 },
  },
  falling: {
    d: "M20 26 C20 16 26 12 36 12 L64 12 C74 12 80 16 80 26 L82 72 C82 80 78 84 74 84 C70 84 70 92 64 92 C58 92 60 84 52 84 L40 84 C34 84 34 94 27 94 C21 94 22 86 20 80 Z",
    stroke: 0,
    eyeY: 44,
    mouthY: 60,
    eyeGap: 11,
    arm: { lx: 21, rx: 79, y: 60 },
    legs: { x: [], y: 0 },
    gloss: { cx: 30, cy: 22, rx: 5, ry: 2.6, rotate: -15 },
  },
};

/** Fixed light-theme hexes (favicon and share images can't use CSS variables). */
export const LEVEL_HEX: Record<LevelKey, string> = {
  soaring: "#3FA34D",
  rising: "#2F6FE4",
  steady: "#F2C230",
  slipping: "#F28C28",
  falling: "#D7383E",
};
