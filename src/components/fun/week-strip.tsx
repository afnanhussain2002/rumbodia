"use client";

import { useMemo } from "react";
import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { dayAverages } from "@/lib/stats/series";
import { cn } from "@/lib/utils/cn";
import { dayKeyToDate, formatLongDay, shiftDayKey, toDayKey, weekStartOf } from "@/lib/utils/date";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";

interface WeekStripProps {
  entries: Entry[];
  weekStartsOn: 0 | 1;
  onSelect: (day: string) => void;
  className?: string;
}

/** Seven date pills (like the reference): a tiny Rumbo per day; today is the dark filled pill. */
export function WeekStrip({ entries, weekStartsOn, onSelect, className }: WeekStripProps) {
  const today = toDayKey(new Date());
  const averages = useMemo(() => dayAverages(entries), [entries]);
  const start = weekStartOf(today, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => shiftDayKey(start, i));

  return (
    <ol className={cn("grid grid-cols-7 gap-1.5 sm:gap-2", className)} aria-label="This week">
      {days.map((day) => {
        const avg = averages.get(day);
        const level = avg === undefined ? null : scoreToLevel(avg);
        const isToday = day === today;
        const future = day > today;
        const weekday = dayKeyToDate(day).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2).toUpperCase();
        return (
          <li key={day} className="min-w-0">
            <button
              type="button"
              disabled={future}
              onClick={() => onSelect(day)}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${formatLongDay(day)}: ${level && avg !== undefined ? `${level.name}, ${formatScore(avg)}` : future ? "upcoming" : "no updates"}`}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-full px-0.5 pt-2.5 pb-2 transition-colors",
                isToday ? "bg-ink-fixed text-cream" : "hover:bg-mood-100",
                future && "opacity-40",
              )}
            >
              <span className={cn("text-[11px] font-bold tracking-wide", !isToday && "text-ink-soft")}>{weekday}</span>
              <span className="font-display text-[15px] leading-none font-bold tabular sm:text-[17px]">{Number(day.slice(8))}</span>
              <span className={cn("flex size-7 items-center justify-center rounded-full sm:size-8", isToday && !level && "bg-white/10")}>
                {future ? (
                  <span className="size-6" />
                ) : (
                  <FaceIcon level={level?.key ?? null} size={26} decorative />
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
