"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Entry } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatDayHeading, formatTime, isoToDayKey } from "@/lib/utils/date";
import { highlight, matchesQuery } from "@/lib/utils/highlight";
import { FaceIcon } from "@/components/levels/face-icon";
import { scoreToLevel } from "@/lib/levels";
import { formatScore } from "@/lib/utils/scores";
import { useShell } from "@/components/shell/shell-context";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";
import { TIME_OF_DAY_LABELS } from "@/lib/constants";

const MAX_RESULTS = 60;

function useSearch(query: string) {
  const { data: entries = [], isLoading } = useAllEntries();
  const groups = useMemo(() => {
    if (!query.trim()) return [];
    const hits = entries
      .filter((e) => matchesQuery([e.text, e.reason, ...e.tags], query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_RESULTS);
    const byDay = new Map<string, Entry[]>();
    for (const e of hits) {
      const day = isoToDayKey(e.createdAt);
      byDay.set(day, [...(byDay.get(day) ?? []), e]);
    }
    return [...byDay.entries()];
  }, [entries, query]);
  const count = groups.reduce((n, [, list]) => n + list.length, 0);
  return { groups, count, isLoading };
}

export function SearchResults({ query, onPick }: { query: string; onPick: (day: string) => void }) {
  const { groups, count, isLoading } = useSearch(query);
  if (!query.trim()) {
    return <p className="py-6 text-center text-ink-soft">Search your updates, Gemini&rsquo;s notes and tags.</p>;
  }
  if (isLoading) return <p className="py-6 text-center text-ink-soft">Loading your updates…</p>;
  if (count === 0) return <p className="py-6 text-center text-ink-soft">No updates match &ldquo;{query.trim()}&rdquo;.</p>;

  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-soft" aria-live="polite">
        {count === MAX_RESULTS ? `First ${MAX_RESULTS} matches` : `${count} match${count === 1 ? "" : "es"}`}
      </p>
      <ul className="space-y-4">
        {groups.map(([day, list]) => (
          <li key={day}>
            <h3 className="mb-1.5 text-[13px] font-semibold text-ink-soft">{formatDayHeading(day)}</h3>
            <ul className="space-y-1.5">
              {list.map((e) => {
                const level = scoreToLevel(e.score);
                const tagHit = e.tags.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()));
                const reasonHit = !e.text.toLowerCase().includes(query.trim().toLowerCase()) && e.reason.toLowerCase().includes(query.trim().toLowerCase());
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onPick(day)}
                      className="flex w-full items-start gap-3 rounded-[14px] p-2.5 text-left hover:bg-bg focus-visible:bg-bg"
                    >
                      <FaceIcon level={level.key} size={28} decorative />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
                          {TIME_OF_DAY_LABELS[e.timeOfDay]} · {formatTime(e.createdAt)}
                          <span className="ml-auto font-semibold tabular" style={{ color: level.textColorVar }}>
                            {formatScore(e.score)}
                          </span>
                        </span>
                        <span className="line-clamp-3 block whitespace-pre-line break-words text-[15px]">{highlight(e.text, query)}</span>
                        {reasonHit && (
                          <span className="mt-0.5 line-clamp-2 block break-words text-[13px] text-ink-soft">{highlight(e.reason, query)}</span>
                        )}
                        {tagHit.length > 0 && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {tagHit.map((t) => (
                              <span key={t} className="rounded-full bg-bg px-2 py-0.5 text-[13px] text-ink-soft">
                                #{highlight(t, query)}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A search field. `inline` = desktop header field with a results popover. */
export function SearchPanel({ inline, autoFocus, onPicked }: { inline?: boolean; autoFocus?: boolean; onPicked?: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const shell = useShell();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();

  useEffect(() => {
    if (!inline || !open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [inline, open]);

  function pick(day: string) {
    shell.openDay(day);
    setOpen(false);
    onPicked?.();
  }

  const field = (
    <div className="relative">
      <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        autoFocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && inline) {
            e.stopPropagation();
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Search updates"
        aria-label="Search updates"
        aria-controls={inline ? resultsId : undefined}
        aria-expanded={inline ? open && !!query : undefined}
        className={cn(
          "h-11 w-full rounded-[14px] border border-line bg-card pr-10 pl-10 text-[15px] text-ink placeholder:text-ink-soft",
          "[&::-webkit-search-cancel-button]:hidden",
          inline && "lg:h-10 lg:w-[240px] 2xl:w-[300px]",
        )}
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft hover:bg-bg"
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );

  if (!inline) {
    return (
      <div>
        <div className="sticky top-0 z-10 -mx-1 bg-card px-1 pb-3">{field}</div>
        <SearchResults query={query} onPick={pick} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {field}
      {open && query.trim() && (
        <div
          id={resultsId}
          className="surface absolute top-full right-0 z-40 mt-2 max-h-[70dvh] w-[420px] animate-fade-in overflow-y-auto p-3"
          style={{ borderRadius: 16 }}
        >
          <SearchResults query={query} onPick={pick} />
        </div>
      )}
    </div>
  );
}
