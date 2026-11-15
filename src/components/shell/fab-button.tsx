"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** The raised round + button in the middle of the bottom bar. */
export function FabButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="New update"
      aria-keyshortcuts="N"
      className={cn(
        "relative -mt-5 inline-flex size-16 shrink-0 items-center justify-center rounded-full",
        "border-[3px] border-brand bg-white text-brand shadow-lg transition-transform active:scale-95",
        className,
      )}
    >
      <Plus size={30} strokeWidth={2.6} aria-hidden />
    </button>
  );
}
