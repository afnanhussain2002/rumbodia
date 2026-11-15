"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  /** Plain text for type-ahead and a11y when `label` is rich. */
  text?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

interface DropdownProps {
  /** Render the trigger. Spread `props` onto a <button>. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  label: string;
  /** Show check marks for `selected` items (select-like menus). */
  checkable?: boolean;
  className?: string;
}

/** A menu button: click/Enter opens, arrows move, Esc or outside click closes. */
export function Dropdown({ trigger, items, align = "start", label, checkable, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    }
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  // Position the menu (fixed, in a portal) so scrolling containers never clip it.
  useLayoutEffect(() => {
    if (!open) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const placeAbove = below < 220 && above > below;
    const maxHeight = Math.min(420, Math.max(160, placeAbove ? above : below));
    const top = placeAbove ? Math.max(8, r.top - 6 - Math.min(maxHeight, 44 * items.length + 12)) : r.bottom + 6;
    setPos(
      align === "end"
        ? { top, right: Math.max(8, window.innerWidth - r.right), maxHeight }
        : { top, left: Math.max(8, Math.min(r.left, window.innerWidth - 216)), maxHeight },
    );
  }, [open, align, items.length]);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  function openMenu(index = Math.max(0, items.findIndex((i) => i.selected))) {
    setActive(index);
    setOpen(true);
  }

  function close(refocus = true) {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => (open ? close() : openMenu()),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu(e.key === "ArrowUp" ? items.length - 1 : 0);
          }
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": menuId,
      })}
      {open && pos && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="surface fixed z-[80] min-w-[200px] max-w-[calc(100vw-16px)] animate-fade-in overflow-y-auto p-1.5"
          style={{ borderRadius: 14, top: pos.top, left: pos.left, right: pos.right, maxHeight: pos.maxHeight }}
        >
          {items.map((item, i) => (
            <button
              key={item.key}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role={checkable ? "menuitemradio" : "menuitem"}
              aria-checked={checkable ? !!item.selected : undefined}
              tabIndex={i === active ? 0 : -1}
              onClick={() => {
                close();
                item.onSelect();
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[15px] font-medium outline-none",
                "focus-visible:bg-bg hover:bg-bg lg:min-h-10",
                item.danger ? "text-danger" : "text-ink",
                item.selected && "text-brand-strong",
              )}
            >
              {item.icon}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {checkable && item.selected && <Check size={16} aria-hidden />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
