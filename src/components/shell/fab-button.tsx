"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** The round + button in the middle of the floating bar, in the mood color. */
export function FabButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="New update"
      aria-keyshortcuts="N"
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full",
        "bg-mood-500 text-mood-ink transition-transform hover:scale-105 active:scale-95",
        className,
      )}
    >
      <Plus size={26} strokeWidth={2.8} aria-hidden />
    </button>
  );
}
