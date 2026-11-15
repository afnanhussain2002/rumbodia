"use client";

import { useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/components/ui/use-focus-trap";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  /** Esc / backdrop. Defaults to onCancel. */
  onDismiss?: () => void;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
  loading?: boolean;
}

const subscribe = () => () => {};

/** A small centered confirm dialog. The confirm button gets focus (it is the default action). */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!props.open || !mounted) return null;
  return createPortal(<DialogInner {...props} />, document.body);
}

function DialogInner({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
  onDismiss,
  children,
  confirmDisabled,
  loading,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dismiss = onDismiss ?? onCancel;
  const ref = useFocusTrap<HTMLDivElement>(true, dismiss);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-[var(--overlay)]" onClick={dismiss} aria-hidden />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="surface relative w-full max-w-[400px] animate-modal-in p-6"
      >
        <h2 id={titleId} className="font-display text-xl font-bold">
          {title}
        </h2>
        {description && (
          <div id={descId} className="mt-2 text-ink-soft">
            {description}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={confirmDisabled}
            loading={loading}
            data-autofocus={children ? undefined : true}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
