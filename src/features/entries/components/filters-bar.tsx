"use client";

import { ChevronDown } from "lucide-react";
import type { TimeOfDay } from "@/types";
import { TIME_OF_DAY_LABELS, TIMES_OF_DAY } from "@/lib/constants";
import { LEVELS, type LevelKey } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { FaceIcon } from "@/components/levels/face-icon";
import { Chip } from "@/components/ui/chip";
import { Dropdown } from "@/components/ui/dropdown";

interface FiltersBarProps {
  level: LevelKey | null;
  time: TimeOfDay | null;
  tag: string | null;
  onChange: (changes: { level?: LevelKey | null; time?: TimeOfDay | null; tag?: string | null }) => void;
}

function FilterButton({ active, children, ...props }: { active: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-semibold whitespace-nowrap",
        active ? "border-transparent bg-brand-soft text-brand-strong" : "border-line bg-card text-ink hover:bg-bg",
      )}
    >
      {children}
      <ChevronDown size={16} aria-hidden />
    </button>
  );
}

export function FiltersBar({ level, time, tag, onChange }: FiltersBarProps) {
  const levelInfo = level ? LEVELS.find((l) => l.key === level) : null;
  return (
    <div className="sticky top-16 z-10 -mx-4 bg-bg/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
      <div className="fade-x flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible" role="toolbar" aria-label="Filters">
        <Dropdown
          label="Filter by level"
          checkable
          items={[
            { key: "all", label: "All levels", selected: !level, onSelect: () => onChange({ level: null }) },
            ...LEVELS.map((l) => ({
              key: l.key,
              label: l.name,
              icon: <FaceIcon level={l.key} size={22} decorative />,
              selected: level === l.key,
              onSelect: () => onChange({ level: l.key }),
            })),
          ]}
          trigger={(props) => (
            <FilterButton {...props} active={!!level}>
              {levelInfo ? (
                <>
                  <FaceIcon level={levelInfo.key} size={18} decorative />
                  {levelInfo.name} days
                </>
              ) : (
                "All levels"
              )}
            </FilterButton>
          )}
        />
        <Dropdown
          label="Filter by time of day"
          checkable
          items={[
            { key: "all", label: "All times", selected: !time, onSelect: () => onChange({ time: null }) },
            ...TIMES_OF_DAY.map((t) => ({
              key: t,
              label: TIME_OF_DAY_LABELS[t],
              selected: time === t,
              onSelect: () => onChange({ time: t }),
            })),
          ]}
          trigger={(props) => (
            <FilterButton {...props} active={!!time}>
              {time ? TIME_OF_DAY_LABELS[time] : "All times"}
            </FilterButton>
          )}
        />
        {tag && (
          <Chip tone="brand" onRemove={() => onChange({ tag: null })} removeLabel={`Clear tag ${tag}`} className="shrink-0">
            #{tag}
          </Chip>
        )}
        {(level || time || tag) && (
          <button
            type="button"
            onClick={() => onChange({ level: null, time: null, tag: null })}
            className="min-h-10 shrink-0 px-2 text-[14px] font-semibold text-ink-soft hover:text-ink"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
