"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { DailyPoint, Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { buildDaySeries, seriesTrend } from "@/lib/stats/series";
import { formatLongDay, formatMonthName, formatShortDate, monthDayKeys, toDayKey } from "@/lib/utils/date";
import { formatScore, mean } from "@/lib/utils/scores";
import { useCanHover, useIsDesktop, useReducedMotion } from "@/hooks/use-media-query";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { Card, CardHeader } from "@/components/ui/card";
import { ChartSvg, makeGeometry } from "@/features/stats/components/rumbo-chart/chart-svg";
import { useAnimatedValues } from "@/features/stats/components/rumbo-chart/use-animated-values";

interface MonthTrendCardProps {
  month: string;
  /** All entries; the card picks the month. */
  entries: Entry[];
  /** Day highlighted in the chart (the calendar's selected day). */
  selectedDay: string | null;
  onSelect: (day: string) => void;
  className?: string;
}

/** Width reserved for "+10" / "−10" axis labels. */
const AXIS_GUTTER = 22;

function dayLabels(points: DailyPoint[], width: number): (string | null)[] {
  const every = width < 400 ? 7 : width < 640 ? 5 : 3;
  return points.map((p) => {
    const d = Number(p.day.slice(8));
    return d === 1 || d % every === 0 ? String(d) : null;
  });
}

const TREND = {
  up: { text: "Going up", Icon: ArrowUpRight, color: "var(--level-rising-text)" },
  down: { text: "Going down", Icon: ArrowDownRight, color: "var(--level-slipping-text)" },
  flat: { text: "Holding steady", Icon: ArrowRight, color: "var(--ink)" },
} as const;

/**
 * A plain line chart of daily scores for the calendar's month. Numbers on the
 * Y axis (no faces), plus a short summary in words.
 */
export function MonthTrendCard({ month, entries, selectedDay, onSelect, className }: MonthTrendCardProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [plotRef, { width }] = useResizeObserver<HTMLDivElement>();
  const isDesktop = useIsDesktop();
  const canHover = useCanHover();
  const reducedMotion = useReducedMotion();

  const today = toDayKey(new Date());
  const height = isDesktop ? 240 : 200;

  const points = useMemo(() => buildDaySeries(entries, monthDayKeys(month)), [entries, month]);
  const target = useMemo(() => points.map((p) => p.average), [points]);
  const values = useAnimatedValues(target, reducedMotion);
  const labels = useMemo(() => dayLabels(points, width), [points, width]);
  const geo = useMemo(() => makeGeometry(width, height, points.length, AXIS_GUTTER), [width, height, points.length]);

  const logged = points.filter((p) => p.average !== null);
  const avg = mean(logged.map((p) => p.average!));
  const best = logged.reduce<DailyPoint | null>((b, p) => (b === null || p.average! > b.average! ? p : b), null);
  const trend = seriesTrend(points);

  const selectedIndex = selectedDay ? points.findIndex((p) => p.day === selectedDay) : -1;
  const selected = selectedIndex >= 0 ? selectedIndex : null;
  const todayIndex = points.findIndex((p) => p.day === today);
  const focusIndex = (canHover ? hovered : null) ?? selected;
  const focus = focusIndex !== null ? points[focusIndex] : undefined;

  const monthName = formatMonthName(month);
  const summary = logged.length
    ? `Score line for ${monthName}: ${logged.length} days logged, average ${formatScore(avg!)}, best ${formatShortDate(best!.day)} at ${formatScore(best!.average!)}${trend ? `, ${TREND[trend.direction].text.toLowerCase()}` : ""}.`
    : `Score line for ${monthName}: no updates yet.`;

  function indexFromEvent(e: React.PointerEvent | React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    return geo.indexAt(e.clientX - rect.left);
  }

  function pick(i: number) {
    const p = points[i];
    if (p && p.day <= today) onSelect(p.day);
  }

  return (
    <Card aria-labelledby="month-trend-title" className={className}>
      <CardHeader
        title="Score line"
        titleId="month-trend-title"
        subtitle={`Your daily score in ${monthName}, from −10 to +10`}
      />

      {logged.length === 0 ? (
        <p className="py-6 text-center text-ink-soft">Log an update and your line starts here.</p>
      ) : (
        <>
          <dl className="mb-4 grid grid-cols-3 gap-2">
            <Stat label="Average">
              <span style={{ color: scoreToLevel(avg!).textColorVar }}>{formatScore(avg!)}</span>
              <span className="block truncate text-[12px] font-medium text-ink-soft">{scoreToLevel(avg!).name}</span>
            </Stat>
            <Stat label="Best day">
              <span style={{ color: scoreToLevel(best!.average!).textColorVar }}>{formatScore(best!.average!)}</span>
              <span className="block truncate text-[12px] font-medium text-ink-soft">{formatShortDate(best!.day)}</span>
            </Stat>
            <Stat label="Trend">
              {trend ? (
                <span className="inline-flex items-center gap-0.5" style={{ color: TREND[trend.direction].color }}>
                  {(() => {
                    const { Icon } = TREND[trend.direction];
                    return <Icon size={20} aria-hidden />;
                  })()}
                </span>
              ) : (
                <span className="text-ink-soft">—</span>
              )}
              <span className="block truncate text-[12px] font-medium text-ink-soft">
                {trend ? TREND[trend.direction].text : "Need 3 days"}
              </span>
            </Stat>
          </dl>

          <div
            ref={plotRef}
            className="relative touch-pan-y cursor-pointer"
            style={{ height }}
            role="img"
            aria-label={summary}
            onPointerMove={(e) => e.pointerType === "mouse" && setHovered(indexFromEvent(e))}
            onPointerLeave={() => setHovered(null)}
            onClick={(e) => pick(indexFromEvent(e))}
          >
            {width > 0 && (
              <ChartSvg
                geo={geo}
                values={values}
                labels={labels}
                mode="line"
                axis="numbers"
                selected={selected}
                hovered={canHover ? hovered : null}
                faceSize={AXIS_GUTTER}
                showAllBarLabels={false}
                todayIndex={todayIndex >= 0 ? todayIndex : null}
              />
            )}
          </div>

          <p className="mt-2 min-h-5 text-[13px] text-ink-soft" aria-live="polite">
            {focus ? (
              focus.average !== null ? (
                <>
                  <span className="font-semibold text-ink">{formatLongDay(focus.day)}</span>
                  {" · "}
                  <span className="font-semibold tabular" style={{ color: scoreToLevel(focus.average).textColorVar }}>
                    {formatScore(focus.average)} {scoreToLevel(focus.average).name}
                  </span>
                  {" · "}
                  {focus.count} update{focus.count === 1 ? "" : "s"}
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink">{formatLongDay(focus.day)}</span> · No updates
                </>
              )
            ) : (
              `${canHover ? "Click" : "Tap"} a point to open that day. Above the dashed line is a good day.`
            )}
          </p>
        </>
      )}
    </Card>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[12px] bg-bg px-3 py-2">
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-bold tabular leading-tight">{children}</dd>
    </div>
  );
}
