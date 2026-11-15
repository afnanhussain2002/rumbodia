import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name (required: icon buttons have no visible text). */
  label: string;
  variant?: "ghost" | "outline" | "onBrand";
  /** "md" = 44px touch target; "sm" = 36px (desktop-only small actions). */
  size?: "md" | "sm";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", size = "md", className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        size === "md" ? "size-11" : "size-11 lg:size-9",
        variant === "ghost" && "text-ink-soft hover:bg-bg hover:text-ink active:bg-bg",
        variant === "outline" && "border border-line bg-card text-ink hover:bg-bg active:bg-bg",
        variant === "onBrand" && "text-on-brand hover:bg-white/15 active:bg-white/15",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
