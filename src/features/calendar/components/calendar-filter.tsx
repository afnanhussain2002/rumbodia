"use client";

import { ChevronDown, Plus } from "lucide-react";
import { LEVELS, type LevelKey } from "@/lib/levels";
import type { LevelCounts } from "@/lib/stats/level-counts";
import { FaceIcon } from "@/components/levels/face-icon";
import { Dropdown } from "@/components/ui/dropdown";

export type CalendarFilterValue = { kind: "level"; level: LevelKey } | { kind: "tag"; tag: string } | null;

interface CalendarFilterProps {
  value: CalendarFilterValue;
  onChange: (v: CalendarFilterValue) => void;
  counts: LevelCounts;
  tags: { name: string; count: number }[];
  onAdd: () => void;
  addLabel: string;
}

export function CalendarFilter({ value, onChange, counts, tags, onAdd, addLabel }: CalendarFilterProps) {
  const current =
    value?.kind === "level" ? LEVELS.find((l) => l.key === value.level)! : null;

  return (
    <div className="surface flex items-center gap-2 p-2 pl-3">
      <Dropdown
        label="Filter days"
        checkable
        className="min-w-0 flex-1"
        items={[
          { key: "all", label: "All days", selected: value === null, onSelect: () => onChange(null) },
          ...LEVELS.map((l) => ({
            key: l.key,
            label: (
              <span>
                {l.name} days <span className="text-ink-soft tabular">{counts[l.key]}×</span>
              </span>
            ),
            icon: <FaceIcon level={l.key} size={24} decorative />,
            selected: value?.kind === "level" && value.level === l.key,
            onSelect: () => onChange({ kind: "level", level: l.key }),
          })),
          ...tags.map((t) => ({
            key: `tag:${t.name}`,
            label: (
              <span>
                #{t.name} <span className="text-ink-soft tabular">{t.count}×</span>
              </span>
            ),
            selected: value?.kind === "tag" && value.tag === t.name,
            onSelect: () => onChange({ kind: "tag", tag: t.name }),
          })),
        ]}
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[12px] px-1 text-left text-[15px] font-semibold hover:bg-bg"
          >
            {current ? (
              <>
                <FaceIcon level={current.key} size={30} decorative />
                <span className="truncate">
                  {current.name} days <span className="text-ink-soft tabular">{counts[current.key]}×</span>
                </span>
              </>
            ) : value?.kind === "tag" ? (
              <span className="truncate">#{value.tag} days</span>
            ) : (
              <span className="truncate">All days</span>
            )}
            <ChevronDown size={18} className="ml-auto shrink-0" aria-hidden />
          </button>
        )}
      />
      <span className="h-7 w-px bg-line" aria-hidden />
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-[12px] px-3 text-[15px] font-semibold text-brand-strong hover:bg-brand-soft"
      >
        add <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}
