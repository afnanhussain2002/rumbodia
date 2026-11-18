import { getLevel, type LevelKey } from "@/lib/levels";
import { Rumbo, RumboEmpty } from "@/features/mascot/rumbo";

interface FaceIconProps {
  /** null = empty dotted circle */
  level: LevelKey | null;
  /** Pixel size. Default 40. */
  size?: number;
  /** For days outside the current month (40% opacity). */
  muted?: boolean;
  /** aria-label override. */
  label?: string;
  /** Hide from assistive tech (decorative duplicate). */
  decorative?: boolean;
  /** Idle animation (off by default for small faces). */
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The level face used across calendars, badges, legends and charts.
 * It is Rumbo, the mascot, at small size: shape + color + expression all carry the level.
 */
export function FaceIcon({ level, size = 40, muted, label, decorative, animated, className, style }: FaceIconProps) {
  const merged = { opacity: muted ? 0.4 : undefined, ...style };
  if (level === null) {
    return (
      <span role={decorative ? undefined : "img"} aria-label={decorative ? undefined : (label ?? "No updates")} className="inline-flex shrink-0">
        <RumboEmpty size={size} className={className} style={merged} />
      </span>
    );
  }
  return (
    <Rumbo
      level={level}
      size={size}
      limbs={false}
      animated={animated ?? false}
      decorative={decorative}
      label={label ?? getLevel(level).name}
      className={className}
      style={merged}
    />
  );
}
