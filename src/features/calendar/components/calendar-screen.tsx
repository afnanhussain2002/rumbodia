"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { countDayLevels } from "@/lib/stats/level-counts";
import { tagCounts } from "@/lib/stats/tag-impact";
import { formatLongDay, isDayKey, isoToDayKey, monthKeyToDate, toDayKey } from "@/lib/utils/date";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useMonthParam, useSetSearchParams } from "@/hooks/use-month-param";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useShell } from "@/components/shell/shell-context";
import { CalendarFilter, type CalendarFilterValue } from "@/features/calendar/components/calendar-filter";
import { DayDetail } from "@/features/calendar/components/day-sheet";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { MonthTrendCard } from "@/features/calendar/components/month-trend-card";
import { YearGrid } from "@/features/calendar/components/year-grid";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { LevelCountCard } from "@/features/stats/components/level-count-card";

export function CalendarScreen() {
  const { month } = useMonthParam();
  const params = useSearchParams();
  const setParams = useSetSearchParams();
  const isDesktop = useIsDesktop();
  const shell = useShell();
  const settings = useSettings();
  const all = useAllEntries();
  const [filter, setFilter] = useState<CalendarFilterValue>(null);
  const [view, setView] = useState<"month" | "year">("month");

  const entries = useMemo(() => all.data ?? [], [all.data]);
  const monthEntries = useMemo(() => entries.filter((e) => isoToDayKey(e.createdAt).startsWith(month)), [entries, month]);
  const counts = useMemo(() => countDayLevels(monthEntries), [monthEntries]);
  const tags = useMemo(() => tagCounts(monthEntries), [monthEntries]);

  const rawDay = params.get("day");
  const today = toDayKey(new Date());
  const selectedDay = isDayKey(rawDay) ? rawDay : month === today.slice(0, 7) ? today : null;
  const addDay = selectedDay && selectedDay <= today ? selectedDay : today;

  const matches = useMemo(() => {
    if (!filter) return null;
    return (_day: string, dayEntries: Entry[], avg: number | null) =>
      filter.kind === "level"
        ? avg !== null && scoreToLevel(avg).key === filter.level
        : dayEntries.some((e) => e.tags.includes(filter.tag));
  }, [filter]);

  function select(day: string) {
    if (isDesktop) setParams({ day });
    else shell.openDay(day);
  }

  const year = monthKeyToDate(month).getFullYear();

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-5">
      <div className="min-w-0 space-y-4 lg:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1">
            <CalendarFilter
              value={filter}
              onChange={setFilter}
              counts={counts}
              tags={tags}
              onAdd={() => shell.openNewUpdate({ day: addDay })}
              addLabel={`Add an update for ${addDay === today ? "today" : formatLongDay(addDay)}`}
            />
          </div>
          <SegmentedControl
            label="Calendar view"
            value={view}
            onChange={setView}
            className="self-start sm:self-center"
            options={[
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
            ]}
          />
        </div>

        {all.isLoading ? (
          <SkeletonCard height={320} label="Loading calendar" />
        ) : view === "month" ? (
          <Card aria-label="Calendar">
            <MonthGrid
              month={month}
              entries={entries}
              weekStartsOn={settings.weekStartsOn}
              selectedDay={isDesktop ? selectedDay : null}
              matches={matches}
              onSelect={select}
            />
          </Card>
        ) : (
          <Card aria-label={`Year ${year}`}>
            <p className="mb-3 font-display text-lg font-bold">{year} in faces</p>
            <YearGrid
              year={year}
              entries={entries}
              onSelect={(day) => {
                setView("month");
                const m = day.slice(0, 7);
                if (isDesktop) setParams({ month: m === today.slice(0, 7) ? null : m, day });
                else shell.openDay(day);
              }}
            />
          </Card>
        )}

        {!all.isLoading && (
          <MonthTrendCard month={month} entries={monthEntries} selectedDay={isDesktop ? selectedDay : null} onSelect={select} />
        )}

        <LevelCountCard entries={monthEntries} month={month} />
      </div>

      {/* Desktop: the selected day's entries inline (no drawer). */}
      <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Selected day">
        <Card>
          {selectedDay ? (
            <DayDetail day={selectedDay} compactHeader />
          ) : (
            <p className="py-8 text-center text-ink-soft">Pick a day to see its updates.</p>
          )}
        </Card>
      </aside>
    </div>
  );
}
