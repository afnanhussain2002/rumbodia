/**
 * The Rumbodia mark: a soft yellow triangle with a face. The face changes with the level.
 * Pure strings with no imports, so the React logo, the mood favicon and scripts/generate-icons.mjs
 * (run with Node's type stripping) all draw exactly the same thing.
 */

export type MarkLevel = "brand" | "soaring" | "rising" | "steady" | "slipping" | "falling";

export const MARK_COLORS: Record<MarkLevel, string> = {
  brand: "#F2C230",
  soaring: "#3FA34D",
  rising: "#2F6FE4",
  steady: "#F2C230",
  slipping: "#F28C28",
  falling: "#D7383E",
};

export const MARK_INK = "#161614";
export const MARK_TILE = "#161614";
const CHEEK = "#F59AA8";

/** Mouth (and brows) per level, in the 100x100 mark space. */
function expression(level: MarkLevel): string {
  const stroke = `fill="none" stroke="${MARK_INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"`;
  switch (level) {
    case "soaring":
      return `<path d="M37 65 H63 Q50 83 37 65 Z" fill="${MARK_INK}" stroke="${MARK_INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    case "steady":
      return `<path d="M44 70 H56" ${stroke}/>`;
    case "slipping":
      return `<path d="M43 73 Q50 66.5 57 73" ${stroke}/>`;
    case "falling":
      return `<path d="M43 73 Q50 66.5 57 73" ${stroke}/><path d="M28 51.5 L42 47.5 M72 51.5 L58 47.5" fill="none" stroke="${MARK_INK}" stroke-width="3" stroke-linecap="round"/>`;
    default: // brand, rising: a small smile
      return `<path d="M42.5 67 Q50 74.5 57.5 67" ${stroke}/>`;
  }
}

const hasCheeks = (level: MarkLevel) => level === "brand" || level === "soaring" || level === "rising" || level === "steady";

/** The triangle and its face, drawn in a 0 0 100 100 box (the shape spans about x 4–96, y 8–92). */
export function markInner(level: MarkLevel = "brand"): string {
  const body = MARK_COLORS[level];
  const cheeks = hasCheeks(level)
    ? `<ellipse cx="28.5" cy="69" rx="4.8" ry="3.2" fill="${CHEEK}" opacity=".9"/><ellipse cx="71.5" cy="69" rx="4.8" ry="3.2" fill="${CHEEK}" opacity=".9"/>`
    : "";
  return (
    `<path d="M50 19 L85 81 L15 81 Z" fill="${body}" stroke="${body}" stroke-width="21" stroke-linejoin="round"/>` +
    cheeks +
    `<circle cx="38.5" cy="58" r="5.4" fill="${MARK_INK}"/><circle cx="61.5" cy="58" r="5.4" fill="${MARK_INK}"/>` +
    `<circle cx="40.2" cy="56.2" r="1.8" fill="#fff"/><circle cx="63.2" cy="56.2" r="1.8" fill="#fff"/>` +
    expression(level)
  );
}

/** A standalone SVG string. `tile` puts the mark on the dark rounded square used for app icons. */
export function markSvg(level: MarkLevel = "brand", opts: { tile?: boolean; size?: number; square?: boolean } = {}): string {
  const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : "";
  if (opts.tile) {
    const bg = opts.square
      ? `<rect width="100" height="100" fill="${MARK_TILE}"/>`
      : `<rect width="100" height="100" rx="24" fill="${MARK_TILE}"/>`;
    // Mark centered and scaled to sit in the middle 70% (also safe for maskable icons).
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${size}>${bg}<g transform="translate(50 51) scale(.7) translate(-50 -50)">${markInner(level)}</g></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 4 94 90"${size}>${markInner(level)}</svg>`;
}
