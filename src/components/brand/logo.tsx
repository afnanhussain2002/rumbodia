import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** "icon" = mark only; "full" = mark + wordmark. */
  variant?: "icon" | "full";
  size?: number;
  className?: string;
  /** Use on brand-colored backgrounds. */
  inverted?: boolean;
}

/**
 * The Rumbodia mark: an "R" whose leg turns into a rising trend line. It dips, then
 * climbs and points up-right, the direction your day is heading ("rumbo" = bearing).
 */
export function LogoMark({ size = 32, inverted, className }: { size?: number; inverted?: boolean; className?: string }) {
  const tile = inverted ? "var(--on-brand)" : "var(--brand)";
  const mark = inverted ? "var(--brand)" : "var(--on-brand)";
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <rect x="1" y="1" width="46" height="46" rx="13" fill={tile} />
      <g fill="none" stroke={mark} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Stem and bowl */}
        <path d="M13 36V12h7.5a6.5 6.5 0 0 1 0 13H13" />
        {/* Leg: dips, then climbs into an arrow */}
        <path d="M19.5 25l6.5 10 12-13.5" />
        <path d="M32.5 21.5H38.5V27.5" />
      </g>
    </svg>
  );
}

export function Logo({ variant = "full", size = 32, className, inverted }: LogoProps) {
  if (variant === "icon") return <LogoMark size={size} inverted={inverted} className={className} />;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} inverted={inverted} />
      <span
        className="font-display font-bold tracking-[-0.01em]"
        style={{ fontSize: Math.round(size * 0.66), color: inverted ? "var(--on-brand)" : "var(--ink)" }}
      >
        Rumbodia
      </span>
    </span>
  );
}
