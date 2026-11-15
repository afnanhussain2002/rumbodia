"use client";

import { useMemo } from "react";
import type { Entry } from "@/types";
import { calendarGrid, toDayKey, weekdayNames } from "@/lib/utils/date";
import { scoresByDay } from "@/lib/stats/series";
import { mean } from "@/lib/utils/scores";
import { DayCell } from "@/features/calendar/components/day-cell";

interface MonthGridProps {
  month: string;
  entries: Entry[];
  weekStartsOn: 0 | 1;
  selectedDay: string | null;
  /** Returns true when a day matches the active filter (null = no filter). */
  matches: ((day: string, dayEntries: Entry[], average: number | null) => boolean) | null;
  onSelect: (day: string) => void;
}

export function MonthGrid({ month, entries, weekStartsOn, selectedDay, matches, onSelect }: MonthGridProps) {
  const today = toDayKey(new Date());
  const cells = useMemo(() => calendarGrid(month, weekStartsOn), [month, weekStartsOn]);
  const byDay = useMemo(() => {
    const scores = scoresByDay(entries);
    const lists = new Map<string, Entry[]>();
    for (const e of entries) {
      const d = toDayKey(new Date(e.createdAt));
      lists.set(d, [...(lists.get(d) ?? []), e]);
    }
    return { scores, lists };
  }, [entries]);

  const names = weekdayNames(weekStartsOn);

  return (
    <div
      className="[--face:40px] sm:[--face:48px] lg:[--face:52px] 2xl:[--face:60px]"
    >
      <div className="mb-1 grid grid-cols-7" aria-hidden>
        {names.map((n) => (
          <span key={n} className="text-center text-[13px] font-semibold text-ink-soft">
            {n}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map(({ day, inMonth }) => {
          const scores = byDay.scores.get(day) ?? [];
          const avg = mean(scores);
          const faded = matches ? !matches(day, byDay.lists.get(day) ?? [], avg) : false;
          return (
            <div key={day} className="min-w-0">
              <DayCell
                day={day}
                inMonth={inMonth}
                average={avg}
                count={scores.length}
                isToday={day === today}
                isFuture={day > today}
                isSelected={day === selectedDay}
                faded={faded}
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
