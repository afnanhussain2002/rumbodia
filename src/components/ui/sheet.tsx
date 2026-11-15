"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/icon-button";
import { useFocusTrap } from "@/components/ui/use-focus-trap";

/**
 * - "form":   full-height sheet on mobile, centered 560px modal from tablet up (New update).
 * - "drawer": bottom sheet (≤90% height) on mobile, 640px bottom sheet on tablet,
 *             right-side drawer on desktop (Day sheet).
 * - "panel":  bottom sheet on mobile, centered 480px modal from tablet up (pickers, search).
 */
export type SheetVariant = "form" | "drawer" | "panel";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Visible title. Use `hideTitle` to keep it for screen readers only. */
  title: string;
  hideTitle?: boolean;
  variant?: SheetVariant;
  children: React.ReactNode;
  /** Optional sticky footer (stays above the keyboard on mobile). */
  footer?: React.ReactNode;
  /** Background tint (a CSS color) for the panel. */
  background?: string;
  initialFocus?: React.RefObject<HTMLElement | null>;
  headerExtra?: React.ReactNode;
  className?: string;
}

const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

export function Sheet(props: SheetProps) {
  const mounted = useMounted();
  if (!props.open || !mounted) return null;
  return createPortal(<SheetInner {...props} />, document.body);
}

function SheetInner({
  onClose,
  title,
  hideTitle,
  variant = "panel",
  children,
  footer,
  background,
  initialFocus,
  headerExtra,
  className,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose, initialFocus);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ startY: number; id: number } | null>(null);

  // Swipe down on the handle/header to close (touch, mobile bottom sheets).
  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
      drag.current = { startY: e.clientY, id: e.pointerId };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!drag.current || drag.current.id !== e.pointerId) return;
      setDragY(Math.max(0, e.clientY - drag.current.startY));
    },
    onPointerUp: () => {
      if (!drag.current) return;
      drag.current = null;
      if (dragY > 90) onClose();
      else setDragY(0);
    },
    onPointerCancel: () => {
      drag.current = null;
      setDragY(0);
    },
  };

  const layout = {
    form: {
      wrap: "items-end sm:items-center sm:justify-center sm:p-6",
      panel:
        "h-[100dvh] w-full animate-sheet-up sm:h-auto sm:max-h-[min(90dvh,820px)] sm:max-w-[560px] sm:rounded-[20px] sm:animate-modal-in",
      handle: false,
    },
    drawer: {
      wrap: "items-end justify-center lg:items-stretch lg:justify-end",
      panel:
        "max-h-[90dvh] w-full rounded-t-[20px] animate-sheet-up sm:max-w-[640px] lg:h-[100dvh] lg:max-h-none lg:w-[420px] lg:max-w-none lg:rounded-none lg:rounded-l-[20px] lg:animate-drawer-in 2xl:w-[460px]",
      handle: true,
    },
    panel: {
      wrap: "items-end sm:items-center sm:justify-center sm:p-6",
      panel:
        "max-h-[90dvh] w-full rounded-t-[20px] animate-sheet-up sm:max-h-[min(85dvh,760px)] sm:max-w-[480px] sm:rounded-[20px] sm:animate-modal-in",
      handle: true,
    },
  }[variant];

  return (
    <div className={cn("fixed inset-0 z-50 flex", layout.wrap)}>
      <div
        className={cn("absolute inset-0 animate-fade-in bg-[var(--overlay)]", variant === "drawer" && "lg:bg-black/15")}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex flex-col overflow-hidden bg-card text-ink shadow-2xl outline-none",
          "pb-[env(safe-area-inset-bottom)]",
          layout.panel,
          className,
        )}
        style={{
          background: background ?? undefined,
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: drag.current ? "none" : "transform 200ms ease-out",
        }}
      >
        <div className="shrink-0 touch-none" {...(layout.handle ? dragHandlers : {})}>
          {layout.handle && (
            <div className={cn("flex justify-center pt-2.5", variant === "drawer" ? "lg:hidden" : "sm:hidden")} aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </div>
          )}
          <div className="flex items-center gap-2 px-4 pt-2 pb-1 sm:px-5 sm:pt-4">
            <IconButton label="Close" onClick={onClose} className="-ml-2">
              <X size={22} aria-hidden />
            </IconButton>
            <h2 id={titleId} className={cn("min-w-0 flex-1 truncate font-display text-lg font-bold", hideTitle && "sr-only")}>
              {title}
            </h2>
            {headerExtra}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
        {footer && (
          <div className="sticky bottom-0 shrink-0 border-t border-line bg-inherit px-4 py-3 sm:px-5" style={{ background: "inherit" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
