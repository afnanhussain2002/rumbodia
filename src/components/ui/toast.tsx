"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ToastOptions {
  message: string;
  tone?: "default" | "error";
  action?: { label: string; onClick: () => void };
  /** ms. Default 4000; 6000 when there is an action (Undo). */
  duration?: number;
  /** Called when the toast goes away without the action being used. */
  onExpire?: () => void;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { ...options, id }]);
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4",
          // Mobile/tablet: bottom center, above the tab bar. Desktop: bottom right.
          "bottom-[calc(84px+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:items-end lg:px-0",
          "[.no-tabbar_&]:bottom-[calc(16px+env(safe-area-inset-bottom))]",
        )}
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  const acted = useRef(false);
  const doneRef = useRef(onDone);
  const expireRef = useRef(toast.onExpire);
  useEffect(() => {
    doneRef.current = onDone;
    expireRef.current = toast.onExpire;
  });

  useEffect(() => {
    const ms = toast.duration ?? (toast.action ? 6000 : 4000);
    const timer = setTimeout(() => {
      if (!acted.current) expireRef.current?.();
      doneRef.current();
    }, ms);
    return () => clearTimeout(timer);
  }, [toast.duration, toast.action]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-[420px] animate-modal-in items-center gap-3 rounded-[14px] px-4 py-3 text-[15px] font-medium shadow-lg",
        toast.tone === "error" ? "bg-danger text-white" : "bg-ink text-card",
      )}
    >
      <span className="min-w-0 flex-1 break-words">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            acted.current = true;
            toast.action!.onClick();
            onDone();
          }}
          className="min-h-10 shrink-0 rounded-lg px-3 font-bold text-brand hover:bg-white/10"
          style={toast.tone === "error" ? { color: "#fff" } : undefined}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          if (!acted.current) expireRef.current?.();
          onDone();
        }}
        className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
