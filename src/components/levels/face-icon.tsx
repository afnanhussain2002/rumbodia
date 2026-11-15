import { getLevel, type LevelKey } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";

interface FaceIconProps {
  /** null = empty grey circle */
  level: LevelKey | null;
  /** Pixel size. Default 40. */
  size?: number;
  /** For days outside the current month (40% opacity). */
  muted?: boolean;
  /** aria-label override. */
  label?: string;
  /** Hide from assistive tech (decorative duplicate). */
  decorative?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const WHITE = "#FFFFFF";

/** Mouth curvature per level: control point offset (positive = smile). */
const MOUTH: Record<LevelKey, { y: number; c: number }> = {
  soaring: { y: 23, c: 12 },
  rising: { y: 24.5, c: 6 },
  steady: { y: 26.5, c: 0 },
  slipping: { y: 28, c: -4 },
  falling: { y: 29, c: -7 },
};

/**
 * Original Rumbodia face: a level-colored circle with white features.
 * Drawn on a 40×40 grid so strokes stay crisp from 16px to 72px.
 */
export function FaceIcon({ level, size = 40, muted, label, decorative, className, style }: FaceIconProps) {
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label ?? (level ? getLevel(level).name : "No updates") };

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ opacity: muted ? 0.4 : undefined, ...style }}
      {...a11y}
    >
      {level === null ? (
        <circle cx="20" cy="20" r="20" fill="var(--empty)" />
      ) : (
        <>
          <circle cx="20" cy="20" r="20" fill={`var(--level-${level})`} />
          <Features level={level} />
        </>
      )}
    </svg>
  );
}

function Features({ level }: { level: LevelKey }) {
  const stroke = { stroke: WHITE, strokeWidth: 2.6, strokeLinecap: "round" as const, fill: "none" };
  const { y, c } = MOUTH[level];

  return (
    <g>
      {/* Eyes */}
      {level === "falling" ? (
        <>
          <path d="M11.5 14 L16.5 16.5" {...stroke} />
          <path d="M28.5 14 L23.5 16.5" {...stroke} />
        </>
      ) : (
        <>
          <circle cx="14" cy={level === "soaring" ? 16.5 : 16} r="2.3" fill={WHITE} />
          <circle cx="26" cy={level === "soaring" ? 16.5 : 16} r="2.3" fill={WHITE} />
        </>
      )}

      {/* Eyebrows (soaring only) */}
      {level === "soaring" && (
        <>
          <path d="M10.5 11.2 Q14 8.6 17.5 11.2" {...stroke} strokeWidth={2.2} />
          <path d="M22.5 11.2 Q26 8.6 29.5 11.2" {...stroke} strokeWidth={2.2} />
        </>
      )}

      {/* Mouth: one quadratic curve. Soaring is an open (filled) smile. */}
      {level === "soaring" ? (
        <path d={`M11.5 ${y} Q20 ${y + c} 28.5 ${y} Z`} fill={WHITE} stroke={WHITE} strokeWidth={1.6} strokeLinejoin="round" />
      ) : (
        <path d={`M13 ${y} Q20 ${y + c} 27 ${y}`} {...stroke} />
      )}
    </g>
  );
}
