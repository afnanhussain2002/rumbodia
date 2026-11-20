import { cn } from "@/lib/utils/cn";
import { MARK_COLORS, markInner, type MarkLevel } from "@/components/brand/mark";

interface LogoProps {
  /** "icon" = mark only; "full" = mark + wordmark. */
  variant?: "icon" | "full";
  /** Height of the mark in px. The wordmark scales with it. */
  size?: number;
  className?: string;
  /** Which face to show. "brand" is the yellow smiling default. */
  level?: MarkLevel;
  /** Wordmark color. Defaults to the page's ink; pass a cream value on dark backgrounds. */
  textColor?: string;
}

/** The Rumbodia mark: a soft triangle with a face (rumbo = direction). */
export function LogoMark({ size = 32, level = "brand", className }: { size?: number; level?: MarkLevel; className?: string }) {
  return (
    <svg
      viewBox="3 4 94 90"
      height={size}
      width={Math.round(size * (94 / 90))}
      className={cn("shrink-0", className)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markInner(level) }}
    />
  );
}

/** "rumbodia" with the i's dot swapped for a little triangle. */
function Wordmark({ size, color }: { size: number; color: string }) {
  const fontSize = Math.round(size * 1.08);
  return (
    <span
      className="font-logo leading-none font-extrabold tracking-[-0.035em] whitespace-nowrap"
      style={{ fontSize, color }}
      aria-hidden
    >
      rumbod
      <span className="relative inline-block">
        ı
        <svg
          viewBox="0 0 20 18"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ width: "0.3em", top: "-0.04em" }}
        >
          <path d="M10 3 L17 15 H3 Z" fill={MARK_COLORS.brand} stroke={MARK_COLORS.brand} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </span>
      a
    </span>
  );
}

export function Logo({ variant = "full", size = 32, className, level = "brand", textColor = "var(--ink)" }: LogoProps) {
  if (variant === "icon") return <LogoMark size={size} level={level} className={className} />;
  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: Math.round(size * 0.3) }} role="img" aria-label="Rumbodia">
      <LogoMark size={size} level={level} />
      <Wordmark size={size} color={textColor} />
    </span>
  );
}
