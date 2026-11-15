"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { Entry, WeeklyInsight } from "@/types";
import { api } from "@/lib/api-client";
import { WEEKLY_MIN_ENTRIES } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { scoreToLevel } from "@/lib/levels";
import { formatShortDate, formatShortWeekday, isoToDayKey, shiftDayKey, weekStartOf } from "@/lib/utils/date";
import { formatScore } from "@/lib/utils/scores";
import { Card, CardHeader } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { SkeletonLines } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface WeeklyInsightCardProps {
  /** Any day in the week to describe. */
  day: string;
  weekStartsOn: 0 | 1;
  allEntries: Entry[];
  entriesLoaded: boolean;
  className?: string;
}

export function WeeklyInsightCard({ day, weekStartsOn, allEntries, entriesLoaded, className }: WeeklyInsightCardProps) {
  const weekStart = weekStartOf(day, weekStartsOn);
  const weekEnd = shiftDayKey(weekStart, 6);
  const weekCount = allEntries.filter((e) => {
    const d = isoToDayKey(e.createdAt);
    return d >= weekStart && d <= weekEnd;
  }).length;
  const enough = weekCount >= WEEKLY_MIN_ENTRIES;
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: queryKeys.insight(weekStart),
    queryFn: () => api.getWeeklyInsight(weekStart),
    enabled: entriesLoaded && enough,
    staleTime: Infinity,
    retry: false,
  });

  const refresh = useMutation({
    mutationFn: () => api.regenerateWeeklyInsight(weekStart),
    onSuccess: (insight) => qc.setQueryData(queryKeys.insight(weekStart), { insight }),
    onError: (err) => toast.show({ message: (err as Error).message, tone: "error" }),
  });

  const insight: WeeklyInsight | null = query.data?.insight ?? null;
  const loading = (query.isLoading && enough) || refresh.isPending;
  const range = `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`;

  return (
    <Card aria-labelledby="weekly-title" className={className} aria-busy={loading || undefined}>
      <CardHeader
        title="This week in a sentence"
        titleId="weekly-title"
        subtitle={range}
        actions={
          enough && insight ? (
            <IconButton label="Refresh weekly read" onClick={() => refresh.mutate()} disabled={loading}>
              <RefreshCw size={20} className={refresh.isPending ? "animate-spin" : undefined} aria-hidden />
            </IconButton>
          ) : undefined
        }
      />

      {!entriesLoaded ? (
        <SkeletonLines />
      ) : !enough ? (
        <p className="text-[15px] text-ink-soft">Log at least 3 updates this week to get your weekly read.</p>
      ) : loading ? (
        <SkeletonLines />
      ) : query.isError ? (
        <div className="space-y-3">
          <p className="text-[15px] text-danger" role="alert">
            {(query.error as Error).message}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : insight ? (
        <div className="space-y-3">
          <p className="font-display text-[19px] leading-snug font-semibold">&ldquo;{insight.headline}&rdquo;</p>
          {(insight.bestDay || insight.hardDay) && (
            <p className="flex flex-wrap gap-x-2 text-[15px] text-ink-soft">
              {insight.bestDay && <DayStat label="Best day" day={insight.bestDay.day} average={insight.bestDay.average} />}
              {insight.bestDay && insight.hardDay && <span aria-hidden>·</span>}
              {insight.hardDay && <DayStat label="Hard day" day={insight.hardDay.day} average={insight.hardDay.average} />}
            </p>
          )}
          {insight.suggestion && (
            <p className="rounded-[14px] bg-brand-soft p-3 text-[15px]">
              <span className="font-semibold text-brand-strong">Try next week: </span>
              {insight.suggestion}
            </p>
          )}
          {insight.entryCount !== weekCount && (
            <p className="text-[13px] text-ink-soft">Based on {insight.entryCount} updates. Refresh to include the newest.</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}

function DayStat({ label, day, average }: { label: string; day: string; average: number }) {
  const level = scoreToLevel(average);
  return (
    <span>
      {label}: {formatShortWeekday(day)}{" "}
      <span className="font-semibold tabular" style={{ color: level.textColorVar }}>
        ({formatScore(average)})
      </span>
    </span>
  );
}
