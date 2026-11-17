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
 * The Rumbodia mark: a smiling face whose smile keeps going and turns into a rising arrow.
 * Your mood, and the direction your day is heading ("rumbo" = bearing).
 */
export function LogoMark({ size = 32, inverted, className }: { size?: number; inverted?: boolean; className?: string }) {
  const tile = inverted ? "var(--on-brand)" : "var(--brand)";
  const mark = inverted ? "var(--brand)" : "var(--on-brand)";
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <rect x="1" y="1" width="46" height="46" rx="13" fill={tile} />
      {/* Eyes */}
      <circle cx="16.5" cy="18.5" r="3.1" fill={mark} />
      <circle cx="29.5" cy="18.5" r="3.1" fill={mark} />
      <g fill="none" stroke={mark} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* Smile that climbs into an arrow */}
        <path d="M11.5 26.5C14.5 33.5 23.5 36.5 30 32L37 25" />
        <path d="M31 25H37V31" />
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
