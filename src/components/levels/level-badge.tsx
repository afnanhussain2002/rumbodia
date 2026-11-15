import { scoreToLevel } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";

interface LevelBadgeProps {
  score: number;
  /** Face size in px. */
  size?: number;
  /** "numbers" shows +5; "levels" shows the level name (number stays in the tooltip). */
  display?: "numbers" | "levels";
  className?: string;
}

/** A face plus its score (or level name), colored by level. Color is never the only signal. */
export function LevelBadge({ score, size = 24, display = "numbers", className }: LevelBadgeProps) {
  const level = scoreToLevel(score);
  const number = formatScore(score);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-semibold tabular", className)}
      title={`${level.name} (${number})`}
    >
      <FaceIcon level={level.key} size={size} decorative />
      <span style={{ color: level.textColorVar }}>{display === "numbers" ? number : level.name}</span>
      <span className="sr-only">{display === "numbers" ? level.name : number}</span>
    </span>
  );
}
