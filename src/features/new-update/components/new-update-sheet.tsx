"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry, TimeOfDay } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { dayKeyToDate, timeOfDayForDate, toDayKey } from "@/lib/utils/date";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { NewUpdateRequest } from "@/components/shell/shell-context";
import { levelLabel, useCreateEntry, useUpdateEntry } from "@/features/entries/hooks/use-entry-mutations";
import { feelingPatterns } from "@/lib/stats/feelings";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { UpdateForm } from "@/features/new-update/components/update-form";
import { ResultView } from "@/features/new-update/components/result-view";
import { useDraft } from "@/features/new-update/hooks/use-draft";

interface NewUpdateSheetProps {
  request: NewUpdateRequest | null;
  onClose: () => void;
  onScored: (entry: Entry) => void;
  onSeeChart: (entry: Entry) => void;
}

export function NewUpdateSheet({ request, onClose, onScored, onSeeChart }: NewUpdateSheetProps) {
  const [tint, setTint] = useState<string | null>(null);
  const close = () => {
    setTint(null);
    onClose();
  };
  return (
    <Sheet
      open={request !== null}
      onClose={close}
      title={request?.entry ? "Edit update" : "New update"}
      variant="form"
      background={tint ?? undefined}
    >
      {/* Keyed so each open starts fresh. */}
      {request && (
        <SheetBody
          key={request.entry?.id ?? request.day ?? "new"}
          request={request}
          onClose={close}
          onScored={onScored}
          onSeeChart={onSeeChart}
          onTint={setTint}
        />
      )}
    </Sheet>
  );
}

/** Default "when" for a backfill day: that day at the current clock time (never in the future). */
function initialWhen(request: NewUpdateRequest): Date | null {
  if (request.entry) return new Date(request.entry.createdAt);
  if (!request.day || request.day >= toDayKey(new Date())) return null;
  const now = new Date();
  const d = dayKeyToDate(request.day);
  d.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return d;
}

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function SheetBody({
  request,
  onClose,
  onScored,
  onSeeChart,
  onTint,
}: {
  request: NewUpdateRequest;
  onClose: () => void;
  onScored: (entry: Entry) => void;
  onSeeChart: (entry: Entry) => void;
  onTint: (color: string) => void;
}) {
  const editing = request.entry ?? null;
  const settings = useSettings();
  const draft = useDraft();
  const toast = useToast();
  const create = useCreateEntry();
  const update = useUpdateEntry();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState(() => editing?.text ?? draft.load());
  const [when, setWhen] = useState<Date | null>(() => initialWhen(request));
  const [manualTime, setManualTime] = useState<TimeOfDay | null>(editing?.timeOfDay ?? null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Entry | null>(null);
  const [askRescore, setAskRescore] = useState(false);
  const [boosts, setBoosts] = useState<string[]>(() => editing?.boosts ?? []);
  const [drains, setDrains] = useState<string[]>(() => editing?.drains ?? []);
  const all = useAllEntries();
  const patterns = useMemo(() => feelingPatterns(all.data ?? []), [all.data]);

  const autoTime = useMemo(
    () => timeOfDayForDate(when ?? new Date(), settings.timeOfDayStarts),
    [when, settings.timeOfDayStarts],
  );
  const timeOfDay = manualTime ?? autoTime;
  const submitting = create.isPending || update.isPending;

  // Keep the draft (new updates only).
  useEffect(() => {
    if (editing) return;
    const id = setTimeout(() => draft.save(text), 300);
    return () => clearTimeout(id);
  }, [text, editing, draft]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.selectionStart = el.selectionEnd = el.value.length;
    });
  }, []);

  function finishScored(entry: Entry) {
    setResult(entry);
    onTint(`color-mix(in srgb, ${scoreToLevel(entry.score).colorVar} 10%, var(--card))`);
    onScored(entry);
    toast.show({ message: `Logged. ${levelLabel(entry.score)}` });
  }

  function submitNew() {
    setError(null);
    create.mutate(
      { text: text.trim(), timeOfDay, createdAt: when ? when.toISOString() : undefined, boosts, drains },
      {
        onSuccess: (entry) => {
          draft.clear();
          finishScored(entry);
        },
        onError: (err) => setError((err as Error).message),
      },
    );
  }

  function submitEdit(rescore: boolean) {
    if (!editing) return;
    setError(null);
    const createdAt = when ? when.toISOString() : undefined;
    const patch = {
      text: text.trim() !== editing.text ? text.trim() : undefined,
      timeOfDay: timeOfDay !== editing.timeOfDay ? timeOfDay : undefined,
      createdAt: createdAt && createdAt !== editing.createdAt ? createdAt : undefined,
      boosts: sameList(boosts, editing.boosts) ? undefined : boosts,
      drains: sameList(drains, editing.drains) ? undefined : drains,
      rescore,
    };
    update.mutate(
      { entry: editing, patch },
      {
        onSuccess: (entry) => {
          if (rescore) finishScored(entry);
          else {
            toast.show({ message: "Update saved." });
            onClose();
          }
        },
        onError: (err) => setError((err as Error).message),
      },
    );
    // Optimistic: without re-scoring the sheet can close right away.
    if (!rescore) onClose();
  }

  function onSubmit() {
    if (!editing) return submitNew();
    if (text.trim() !== editing.text) setAskRescore(true);
    else submitEdit(false);
  }

  if (result) {
    return (
      <ResultView
        entry={result}
        onDone={onClose}
        onSeeChart={() => {
          onSeeChart(result);
          onClose();
        }}
      />
    );
  }

  return (
    <>
      <UpdateForm
        text={text}
        onTextChange={(t) => {
          setText(t);
          if (error) setError(null);
        }}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={setManualTime}
        when={when}
        onWhenChange={setWhen}
        submitting={submitting}
        error={error}
        onSubmit={onSubmit}
        textareaRef={textareaRef}
        isEdit={!!editing}
        boosts={boosts}
        drains={drains}
        onBoostsChange={setBoosts}
        onDrainsChange={setDrains}
        boostSuggestions={patterns.boosts.map((p) => p.label)}
        drainSuggestions={patterns.drains.map((p) => p.label)}
      />
      <ConfirmDialog
        open={askRescore}
        title="Re-score with Gemini?"
        description="You changed the text. Gemini can read it again and update the score."
        confirmLabel="Re-score"
        cancelLabel="Keep score"
        onConfirm={() => {
          setAskRescore(false);
          submitEdit(true);
        }}
        onCancel={() => {
          setAskRescore(false);
          submitEdit(false);
        }}
        onDismiss={() => setAskRescore(false)}
      />
    </>
  );
}

