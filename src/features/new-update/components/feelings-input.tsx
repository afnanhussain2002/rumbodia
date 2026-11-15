"use client";

import { useId, useState } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { MAX_FEELING_LENGTH, MAX_FEELINGS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { Chip } from "@/components/ui/chip";

interface FeelingFieldProps {
  kind: "boost" | "drain";
  items: string[];
  onChange: (items: string[]) => void;
  /** Past answers the user can tap to reuse. */
  suggestions: string[];
  disabled?: boolean;
}

const COPY = {
  boost: {
    title: "What gave you motivation or confidence?",
    placeholder: "e.g. finished my workout, a customer said thanks",
    icon: TrendingUp,
    color: "var(--level-soaring-text)",
  },
  drain: {
    title: "What brought it down?",
    placeholder: "e.g. skipped sleep, no replies to my emails",
    icon: TrendingDown,
    color: "var(--level-falling-text)",
  },
} as const;

function FeelingField({ kind, items, onChange, suggestions, disabled }: FeelingFieldProps) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const copy = COPY[kind];
  const Icon = copy.icon;
  const full = items.length >= MAX_FEELINGS;
  const lower = items.map((i) => i.toLowerCase());
  const unused = suggestions.filter((s) => !lower.includes(s.toLowerCase())).slice(0, 4);

  function add(raw: string) {
    const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_FEELING_LENGTH);
    if (!text || full || lower.includes(text.toLowerCase())) return;
    onChange([...items, text]);
    setDraft("");
  }

  return (
    <div>
      <label htmlFor={inputId} className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: copy.color }}>
        <Icon size={16} aria-hidden />
        {copy.title}
      </label>

      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={copy.title}>
          {items.map((item) => (
            <li key={item} className="max-w-full">
              <Chip tone="brand" onRemove={disabled ? undefined : () => onChange(items.filter((i) => i !== item))} removeLabel={`Remove ${item}`}>
                {item}
              </Chip>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div className="mt-2 flex items-center gap-2">
          <input
            id={inputId}
            value={draft}
            maxLength={MAX_FEELING_LENGTH}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Enter adds the chip. Ctrl/Cmd+Enter still submits the form.
                if (e.ctrlKey || e.metaKey) return;
                e.preventDefault();
                add(draft);
              }
            }}
            onBlur={() => add(draft)}
            placeholder={copy.placeholder}
            className={cn(
              "h-11 min-w-0 flex-1 rounded-[12px] border border-line bg-bg/60 px-3 text-[15px] text-ink",
              "placeholder:text-ink-soft/80 focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-focus",
            )}
          />
          <button
            type="button"
            onClick={() => add(draft)}
            disabled={disabled || !draft.trim()}
            aria-label={`Add to: ${copy.title}`}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-line text-ink hover:bg-bg disabled:opacity-40"
          >
            <Plus size={18} aria-hidden />
          </button>
        </div>
      )}

      {!full && unused.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Your earlier answers">
          {unused.map((s) => (
            <li key={s} className="max-w-full">
              <Chip onClick={() => add(s)}>+ {s}</Chip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FeelingsInputProps {
  boosts: string[];
  drains: string[];
  onBoostsChange: (items: string[]) => void;
  onDrainsChange: (items: string[]) => void;
  boostSuggestions: string[];
  drainSuggestions: string[];
  disabled?: boolean;
}

/** Optional: tell Rumbodia what lifted or lowered your motivation and confidence. */
export function FeelingsInput(props: FeelingsInputProps) {
  const count = props.boosts.length + props.drains.length;
  const [open, setOpen] = useState(count > 0);
  const panelId = useId();

  return (
    <section aria-label="What moved you">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-[10px] text-left text-[15px] font-semibold text-ink"
      >
        <span>
          What moved you today? <span className="font-medium text-ink-soft">(optional{count > 0 ? `, ${count} added` : ""})</span>
        </span>
        <span aria-hidden className="text-ink-soft">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div id={panelId} className="mt-2 space-y-4 rounded-[14px] border border-line p-3">
          <p className="text-[13px] font-medium text-ink-soft">
            Tell Gemini what lifted your motivation or confidence, and what pulled it down. It uses this to read your days better and give you more personal tips.
          </p>
          <FeelingField kind="boost" items={props.boosts} onChange={props.onBoostsChange} suggestions={props.boostSuggestions} disabled={props.disabled} />
          <FeelingField kind="drain" items={props.drains} onChange={props.onDrainsChange} suggestions={props.drainSuggestions} disabled={props.disabled} />
        </div>
      )}
    </section>
  );
}
