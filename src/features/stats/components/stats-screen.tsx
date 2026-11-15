"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { monthDayKeys, monthRange, toDayKey } from "@/lib/utils/date";
import { useMonthParam } from "@/hooks/use-month-param";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useShell } from "@/components/shell/shell-context";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { FeelingsCard } from "@/features/stats/components/feelings-card";
import { MomentumChartCard } from "@/features/stats/components/momentum-chart-card";
import { LevelCountCard } from "@/features/stats/components/level-count-card";
import { RumboChartCard } from "@/features/stats/components/rumbo-chart/rumbo-chart-card";
import { StreakCard } from "@/features/stats/components/streak-card";
import { TagImpactCard } from "@/features/stats/components/tag-impact-card";
import { TimeOfDayCard } from "@/features/stats/components/time-of-day-card";
import { WeeklyInsightCard } from "@/features/stats/components/weekly-insight-card";

const PLACE = {
  streak: "sm:col-start-1 sm:row-start-1 lg:col-span-4 lg:col-start-9 lg:row-start-1",
  chart: "sm:col-span-2 sm:row-start-2 lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1",
  levels: "sm:col-start-2 sm:row-start-1 lg:col-span-4 lg:col-start-1 lg:row-start-3",
  weekly: "sm:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-2",
  tags: "sm:col-span-2 lg:col-span-4 lg:col-start-5 lg:row-start-3",
  time: "sm:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-3",
  feelings: "sm:col-span-2 lg:col-span-12 lg:col-start-1 lg:row-start-4",
  momentum: "sm:col-span-2 lg:col-span-12 lg:col-start-1 lg:row-start-5",
};

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5";

export function StatsScreen() {
  const { month, isCurrentMonth } = useMonthParam();
  const settings = useSettings();
  const shell = useShell();
  const all = useAllEntries();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const entries = useMemo(() => all.data ?? [], [all.data]);
  const monthEntries = useMemo(() => {
    const { from, to } = monthRange(month);
    const a = Date.parse(from);
    const b = Date.parse(to);
    return entries.filter((e) => {
      const t = Date.parse(e.createdAt);
      return t >= a && t < b;
    });
  }, [entries, month]);

  if (all.isLoading) {
    return (
      <div className={GRID}>
        <SkeletonCard height={110} className={PLACE.streak} label="Loading streak" />
        <SkeletonCard height={260} className={PLACE.chart} label="Loading chart" />
        <SkeletonCard height={150} className={PLACE.levels} label="Loading level count" />
        <SkeletonCard height={90} className={PLACE.weekly} label="Loading weekly read" />
      </div>
    );
  }

  if (all.isError) {
    return (
      <Card>
        <p role="alert" className="text-danger">
          Could not load your log. {(all.error as Error).message}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => void all.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Your direction starts with one update."
          description="Write what you did today. Gemini reads it against your goals and your chart starts moving."
          action={
            <Button size="lg" icon={<Plus size={18} aria-hidden />} onClick={() => shell.openNewUpdate()}>
              Log your first update
            </Button>
          }
        />
      </Card>
    );
  }

  const days = monthDayKeys(month);
  const insightDay = selectedDay && selectedDay.startsWith(month) ? selectedDay : isCurrentMonth ? toDayKey(new Date()) : days[days.length - 1]!;

  return (
    <div className={GRID}>
      <StreakCard entries={entries} className={PLACE.streak} />
      <RumboChartCard
        month={month}
        entries={entries}
        weekStartsOn={settings.weekStartsOn}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        className={PLACE.chart}
      />
      <LevelCountCard entries={monthEntries} month={month} className={PLACE.levels} />
      <WeeklyInsightCard
        day={insightDay}
        weekStartsOn={settings.weekStartsOn}
        allEntries={entries}
        entriesLoaded={all.isSuccess}
        className={PLACE.weekly}
      />
      <TagImpactCard entries={monthEntries} className={PLACE.tags} />
      <TimeOfDayCard entries={monthEntries} className={PLACE.time} />
      <FeelingsCard entries={entries} className={PLACE.feelings} />
      <MomentumChartCard month={month} entries={entries} className={PLACE.momentum} />
    </div>
  );
}
