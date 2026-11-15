import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  tone?: "brand" | "neutral";
  selected?: boolean;
  className?: string;
  title?: string;
}

/** Small pill. Clickable when `onClick` is given; removable with `onRemove`. */
export function Chip({ children, onClick, onRemove, removeLabel, tone = "neutral", selected, className, title }: ChipProps) {
  const base = cn(
    "inline-flex max-w-full items-center gap-1 rounded-full text-[13px] font-medium whitespace-nowrap",
    tone === "brand" || selected ? "bg-brand-soft text-brand-strong" : "bg-bg text-ink-soft",
    className,
  );

  const content = <span className="truncate">{children}</span>;

  if (onRemove) {
    return (
      <span className={cn(base, "py-1 pl-3 pr-1")} title={title}>
        {onClick ? (
          <button type="button" onClick={onClick} className="truncate">
            {children}
          </button>
        ) : (
          content
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Remove"}
          className="inline-flex size-7 items-center justify-center rounded-full hover:bg-black/5"
        >
          <X size={14} aria-hidden />
        </button>
      </span>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, "min-h-8 px-3 py-1 hover:text-ink")} title={title} aria-pressed={selected}>
        {content}
      </button>
    );
  }
  return (
    <span className={cn(base, "px-2.5 py-0.5")} title={title}>
      {content}
    </span>
  );
}
