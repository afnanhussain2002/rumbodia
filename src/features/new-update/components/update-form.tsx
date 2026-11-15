"use client";

import { useRef, useState } from "react";
import { ChevronDown, CircleAlert, Loader2 } from "lucide-react";
import type { TimeOfDay } from "@/types";
import { MAX_UPDATE_LENGTH, TIME_OF_DAY_LABELS, TIMES_OF_DAY } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { formatDayHeading, formatTime, toDateTimeLocalValue, toDayKey } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FeelingsInput } from "@/features/new-update/components/feelings-input";
import { continueNumberedList } from "@/features/new-update/components/numbered-list";

interface UpdateFormProps {
  text: string;
  onTextChange: (text: string) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (t: TimeOfDay) => void;
  /** null = now */
  when: Date | null;
  onWhenChange: (d: Date | null) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isEdit: boolean;
  boosts: string[];
  drains: string[];
  onBoostsChange: (items: string[]) => void;
  onDrainsChange: (items: string[]) => void;
  boostSuggestions: string[];
  drainSuggestions: string[];
}

export function UpdateForm({
  text,
  onTextChange,
  timeOfDay,
  onTimeOfDayChange,
  when,
  onWhenChange,
  submitting,
  error,
  onSubmit,
  textareaRef,
  isEdit,
  boosts,
  drains,
  onBoostsChange,
  onDrainsChange,
  boostSuggestions,
  drainSuggestions,
}: UpdateFormProps) {
  const [pickingTime, setPickingTime] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  const shown = when ?? new Date();
  const whenLabel = `${formatDayHeading(toDayKey(shown))}, ${formatTime(shown.toISOString())}`;
  const empty = !text.trim();

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!empty && !submitting) onSubmit();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      const el = e.currentTarget;
      if (el.selectionStart !== el.selectionEnd) return;
      const result = continueNumberedList(el.value, el.selectionStart);
      if (!result) return;
      e.preventDefault();
      onTextChange(result.value);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = result.caret;
      });
    }
  }

  return (
    <form
      className="flex h-full min-h-0 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!empty && !submitting) onSubmit();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 pt-1">
        <p className="font-display text-[22px] font-bold">{isEdit ? "Edit your update" : "¡Hola! How did it go?"}</p>

        <SegmentedControl
          label="Time of day"
          options={TIMES_OF_DAY.map((t) => ({ value: t, label: TIME_OF_DAY_LABELS[t] }))}
          value={timeOfDay}
          onChange={onTimeOfDayChange}
          fullWidth
          size="sm"
          disabled={submitting}
        />

        <label className="sr-only" htmlFor="update-text">
          What did you do?
        </label>
        <textarea
          id="update-text"
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          readOnly={submitting}
          maxLength={MAX_UPDATE_LENGTH}
          rows={8}
          placeholder={"1. Ran 1 km, did 5 push-ups\n2. Talked with 2 customers\n3. Got 0 new users today"}
          aria-describedby="update-hint"
          className={cn(
            "min-h-[180px] w-full flex-1 resize-none rounded-[14px] border border-line bg-bg/60 p-4 text-[16px] leading-relaxed text-ink",
            "placeholder:text-ink-soft/80 focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-focus",
            "sm:max-h-[50dvh] sm:flex-none [field-sizing:content] sm:min-h-[calc(8lh+2rem)]",
            submitting && "opacity-70",
          )}
        />

        <div className="flex flex-wrap items-center justify-between gap-2" id="update-hint">
          <div className="min-w-0">
            {pickingTime ? (
              <label className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
                <span className="sr-only">Date and time of this update</span>
                <input
                  ref={pickerRef}
                  type="datetime-local"
                  value={toDateTimeLocalValue(shown)}
                  max={toDateTimeLocalValue(new Date())}
                  disabled={submitting}
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    if (Number.isNaN(d.getTime())) return;
                    onWhenChange(d.getTime() > Date.now() ? null : d);
                  }}
                  onBlur={() => setPickingTime(false)}
                  className="h-10 rounded-[10px] border border-line bg-card px-2 text-[15px] text-ink"
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPickingTime(true);
                  requestAnimationFrame(() => {
                    pickerRef.current?.focus();
                    try {
                      pickerRef.current?.showPicker?.();
                    } catch {
                      /* showPicker needs a user gesture in some browsers */
                    }
                  });
                }}
                disabled={submitting}
                className="inline-flex min-h-10 items-center gap-1 rounded-[10px] px-1 text-[13px] font-semibold text-ink-soft hover:text-ink"
                aria-label={`When: ${whenLabel}. Change date and time`}
              >
                {whenLabel}
                <ChevronDown size={16} aria-hidden />
              </button>
            )}
          </div>
          <span className="text-[13px] font-medium text-ink-soft tabular" aria-live="off">
            {text.length} / {MAX_UPDATE_LENGTH}
          </span>
        </div>

        <FeelingsInput
          boosts={boosts}
          drains={drains}
          onBoostsChange={onBoostsChange}
          onDrainsChange={onDrainsChange}
          boostSuggestions={boostSuggestions}
          drainSuggestions={drainSuggestions}
          disabled={submitting}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 bg-card px-4 pt-2 pb-1 sm:-mx-5 sm:px-5">
        {error && (
          <div role="alert" className="mb-3 flex items-start gap-2 rounded-[14px] bg-danger-soft p-3 text-[15px] text-danger">
            <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 break-words">{error}</span>
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={empty || submitting} aria-keyshortcuts="Control+Enter">
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              Reading your update…
            </>
          ) : error ? (
            "Try again"
          ) : isEdit ? (
            "Save update"
          ) : (
            "Log update"
          )}
        </Button>
      </div>
    </form>
  );
}
