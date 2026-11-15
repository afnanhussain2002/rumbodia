"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { Entry, TimeOfDay } from "@/types";
import { TIMES_OF_DAY } from "@/lib/constants";
import { isLevelKey, scoreToLevel } from "@/lib/levels";
import { dayAverages } from "@/lib/stats/series";
import { tagCounts } from "@/lib/stats/tag-impact";
import { formatMonthName, isoToDayKey } from "@/lib/utils/date";
import { useMonthParam, useSetSearchParams } from "@/hooks/use-month-param";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useShell } from "@/components/shell/shell-context";
import { DayCard } from "@/features/entries/components/day-card";
import { FiltersBar } from "@/features/entries/components/filters-bar";
import { useMonthEntries } from "@/features/entries/hooks/use-entries-query";
import { LevelCountCard } from "@/features/stats/components/level-count-card";
import { TimeOfDayCard } from "@/features/stats/components/time-of-day-card";

export function EntriesScreen() {
  const { month } = useMonthParam();
  const params = useSearchParams();
  const setParams = useSetSearchParams();
  const shell = useShell();
  const query = useMonthEntries(month);

  const rawLevel = params.get("level");
  const rawTime = params.get("time");
  const level = isLevelKey(rawLevel) ? rawLevel : null;
  const time = TIMES_OF_DAY.includes(rawTime as TimeOfDay) ? (rawTime as TimeOfDay) : null;
  const tag = params.get("tag")?.trim().toLowerCase() || null;

  const entries = useMemo(() => query.data ?? [], [query.data]);

  const days = useMemo(() => {
    const averages = dayAverages(entries);
    const byDay = new Map<string, Entry[]>();
    for (const e of entries) {
      const d = isoToDayKey(e.createdAt);
      byDay.set(d, [...(byDay.get(d) ?? []), e]);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([day, all]) => ({
        day,
        all,
        shown: all.filter((e) => (!time || e.timeOfDay === time) && (!tag || e.tags.includes(tag))),
        level: scoreToLevel(averages.get(day) ?? 0).key,
      }))
      .filter((d) => d.shown.length > 0 && (!level || d.level === level));
  }, [entries, level, time, tag]);

  const topTags = useMemo(() => tagCounts(entries).slice(0, 8), [entries]);
  const filtering = !!(level || time || tag);
  const onTag = (t: string) => setParams({ tag: tag === t ? null : t });

  const list = query.isLoading ? (
    <div className="space-y-4">
      <SkeletonCard height={140} label="Loading updates" />
      <SkeletonCard height={100} label="Loading updates" />
    </div>
  ) : query.isError ? (
    <Card>
      <p role="alert" className="text-danger">
        Could not load your updates. {(query.error as Error).message}
      </p>
      <Button variant="secondary" className="mt-4" onClick={() => void query.refetch()}>
        Try again
      </Button>
    </Card>
  ) : entries.length === 0 ? (
    <Card>
      <EmptyState
        title={`No updates in ${formatMonthName(month)} yet.`}
        action={
          <Button size="lg" icon={<Plus size={18} aria-hidden />} onClick={() => shell.openNewUpdate()}>
            Log your first update
          </Button>
        }
      />
    </Card>
  ) : days.length === 0 ? (
    <Card>
      <EmptyState
        title="No updates match these filters."
        action={
          <Button variant="secondary" onClick={() => setParams({ level: null, time: null, tag: null })}>
            Clear filters
          </Button>
        }
      />
    </Card>
  ) : (
    <div className="space-y-4 lg:space-y-5">
      {days.map((d) => (
        <DayCard key={d.day} day={d.day} entries={d.shown} allDayEntries={d.all} onTagClick={onTag} activeTag={tag} />
      ))}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-5">
      <div className="min-w-0 2xl:max-w-[760px]">
        <FiltersBar
          level={level}
          time={time}
          tag={tag}
          onChange={(c) => {
            const changes: Record<string, string | null> = {};
            if ("level" in c) changes.level = c.level ?? null;
            if ("time" in c) changes.time = c.time ?? null;
            if ("tag" in c) changes.tag = c.tag ?? null;
            setParams(changes);
          }}
        />
        <div className="mt-2 lg:mt-4">{list}</div>
        {filtering && days.length > 0 && <p className="sr-only" aria-live="polite">{`${days.length} days shown`}</p>}
      </div>

      {/* Desktop: sticky month summary. */}
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:space-y-5" aria-label="Month summary">
        <h2 className="sr-only">Month summary</h2>
        <LevelCountCard entries={entries} month={month} mini />
        <Card>
          <CardHeader title="Top tags" />
          {topTags.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {topTags.map((t) => (
                <li key={t.name}>
                  <button
                    type="button"
                    onClick={() => onTag(t.name)}
                    aria-pressed={tag === t.name}
                    className={
                      tag === t.name
                        ? "min-h-9 rounded-full bg-brand-soft px-3 text-[13px] font-semibold text-brand-strong"
                        : "min-h-9 rounded-full bg-bg px-3 text-[13px] font-medium text-ink-soft hover:text-ink"
                    }
                  >
                    #{t.name} <span className="tabular">{t.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-ink-soft">Tags appear after a few updates.</p>
          )}
        </Card>
        <TimeOfDayCard entries={entries} compact />
      </aside>
    </div>
  );
}
