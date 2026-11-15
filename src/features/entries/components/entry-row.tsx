"use client";

import { useState } from "react";
import { ChevronDown, Ellipsis, Pencil, RefreshCw, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import type { Entry } from "@/types";
import { TIME_OF_DAY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import { LevelBadge } from "@/components/levels/level-badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { useShell } from "@/components/shell/shell-context";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useDeleteEntry, useRescoreEntry } from "@/features/entries/hooks/use-entry-mutations";

interface EntryRowProps {
  entry: Entry;
  onTagClick?: (tag: string) => void;
  activeTag?: string | null;
}

export function EntryRow({ entry, onTagClick, activeTag }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const shell = useShell();
  const settings = useSettings();
  const rescore = useRescoreEntry();
  const deleteEntry = useDeleteEntry();
  const hasDetails = entry.wins.length > 0 || entry.slips.length > 0;

  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[13px] font-semibold text-brand-strong">
          {TIME_OF_DAY_LABELS[entry.timeOfDay]}
        </span>
        <time dateTime={entry.createdAt} className="text-[13px] font-medium text-ink-soft tabular">
          {formatTime(entry.createdAt)}
        </time>
        {entry.updatedAt && <span className="text-[13px] text-ink-soft">· edited</span>}
        <span className="ml-auto" />
        <LevelBadge score={entry.score} display={settings.scoreDisplay} />
        <Dropdown
          label="Update actions"
          align="end"
          items={[
            { key: "edit", label: "Edit", icon: <Pencil size={16} aria-hidden />, onSelect: () => shell.openNewUpdate({ entry }) },
            { key: "rescore", label: "Re-score", icon: <RefreshCw size={16} aria-hidden />, onSelect: () => rescore(entry) },
            { key: "delete", label: "Delete", danger: true, icon: <Trash2 size={16} aria-hidden />, onSelect: () => setConfirmDelete(true) },
          ]}
          trigger={(props) => (
            <button
              {...props}
              type="button"
              aria-label="Update actions"
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink-soft hover:bg-bg hover:text-ink lg:size-9"
            >
              <Ellipsis size={20} aria-hidden />
            </button>
          )}
        />
      </div>

      <p className="mt-2 whitespace-pre-line break-words text-[16px] leading-relaxed">{entry.text}</p>

      {entry.reason && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="group flex w-full items-start gap-1 text-left text-[15px] text-ink-soft"
          >
            <span className={cn("min-w-0 flex-1 break-words", !expanded && "line-clamp-2")}>&ldquo;{entry.reason}&rdquo;</span>
            <ChevronDown
              size={18}
              aria-hidden
              className={cn("mt-0.5 shrink-0 transition-transform", expanded && "rotate-180")}
            />
            <span className="sr-only">{expanded ? "Show less" : "Show more"}</span>
          </button>
          {expanded && hasDetails && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <WinSlipList title="Went well" items={entry.wins} />
              <WinSlipList title="Slipped" items={entry.slips} />
            </div>
          )}
        </div>
      )}

      {(entry.boosts.length > 0 || entry.drains.length > 0) && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="What moved you">
          {entry.boosts.map((b) => (
            <li key={`b-${b}`} className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[13px] font-medium" style={{ color: "var(--level-soaring-text)" }}>
              <TrendingUp size={14} aria-hidden className="shrink-0" />
              <span className="sr-only">Lifted you: </span>
              <span className="truncate">{b}</span>
            </li>
          ))}
          {entry.drains.map((d) => (
            <li key={`d-${d}`} className="inline-flex max-w-full items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-[13px] font-medium" style={{ color: "var(--level-falling-text)" }}>
              <TrendingDown size={14} aria-hidden className="shrink-0" />
              <span className="sr-only">Brought you down: </span>
              <span className="truncate">{d}</span>
            </li>
          ))}
        </ul>
      )}

      {entry.tags.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tags">
          {entry.tags.map((tag) => (
            <li key={tag}>
              {onTagClick ? (
                <button
                  type="button"
                  onClick={() => onTagClick(tag)}
                  aria-pressed={activeTag === tag}
                  className={cn(
                    "min-h-8 rounded-full px-2.5 text-[13px] font-medium",
                    activeTag === tag ? "bg-brand-soft text-brand-strong" : "bg-bg text-ink-soft hover:text-ink",
                  )}
                >
                  #{tag}
                </button>
              ) : (
                <span className="rounded-full bg-bg px-2.5 py-1 text-[13px] font-medium text-ink-soft">#{tag}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this update?"
        description="Your charts will change."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteEntry(entry);
        }}
      />
    </article>
  );
}

export function WinSlipList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
      {items.length ? (
        <ul className="mt-1 space-y-0.5 text-[15px] text-ink-soft">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 break-words">
              <span aria-hidden>•</span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[15px] text-ink-soft">Nothing here.</p>
      )}
    </div>
  );
}
