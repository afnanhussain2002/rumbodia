"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, ChartLine, ChevronRight, ZoomIn } from "lucide-react";
import type { DailyPoint, Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { buildDaySeries, buildWeeklySeries } from "@/lib/stats/series";
import { cn } from "@/lib/utils/cn";
import {
  dayKeysEnding,
  formatLongDay,
  formatMonthTitle,
  formatShortDate,
  formatShortWeekday,
  monthDayKeys,
  shiftDayKey,
  toDayKey,
} from "@/lib/utils/date";
import { formatScore, mean } from "@/lib/utils/scores";
import { useCanHover, useMediaQuery, useReducedMotion } from "@/hooks/use-media-query";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { FaceIcon } from "@/components/levels/face-icon";
import { Card, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { useShell } from "@/components/shell/shell-context";
import { useTagsQuery } from "@/features/entries/hooks/use-entries-query";
import { ChartSvg, makeGeometry, type ChartMode } from "@/features/stats/components/rumbo-chart/chart-svg";
import { useAnimatedValues } from "@/features/stats/components/rumbo-chart/use-animated-values";
import { ShareButton } from "@/features/stats/components/share-button";

export type ChartRange = "month" | "7" | "30" | "year";

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "year", label: "Year" },
];

interface RumboChartCardProps {
  month: string;
  /** All entries; the chart picks its own window. */
  entries: Entry[];
  weekStartsOn: 0 | 1;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  className?: string;
}

function xLabels(points: DailyPoint[], range: ChartRange, width: number): (string | null)[] {
  const every = width < 400 ? 5 : width < 700 ? 3 : 1;
  if (range === "year") {
    let lastMonth = "";
    let shown = 0;
    return points.map((p) => {
      const m = p.day.slice(0, 7);
      if (m === lastMonth) return null;
      lastMonth = m;
      shown++;
      if (width < 500 && shown % 2 === 0) return null;
      return new Date(`${p.day}T12:00:00`).toLocaleDateString("en-US", { month: "short" });
    });
  }
  if (range === "7") return points.map((p) => (width < 360 ? formatShortWeekday(p.day).slice(0, 2) : formatShortWeekday(p.day)));
  return points.map((p, i) => {
    const d = Number(p.day.slice(8));
    if (range === "30") return i % every === 0 ? (d === 1 || i === 0 ? formatShortDate(p.day) : String(d)) : null;
    return d === 1 || (d - 1) % every === 0 ? String(d) : null;
  });
}

export function RumboChartCard({ month, entries, weekStartsOn, selectedDay, onSelectDay, className }: RumboChartCardProps) {
  const [mode, setMode] = useState<ChartMode>("line");
  const [range, setRange] = useState<ChartRange>("month");
  const [showRanges, setShowRanges] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [tagSheet, setTagSheet] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [highlight, setHighlight] = useState(0);
  const cardRef = useRef<HTMLElement>(null);
  const scrubbing = useRef(false);
  const lastPointer = useRef<string>("mouse");

  const shell = useShell();
  const tags = useTagsQuery();
  const reducedMotion = useReducedMotion();
  const canHover = useCanHover();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isWide = useMediaQuery("(min-width: 1440px)");
  const [plotRef, { width }] = useResizeObserver<HTMLDivElement>();

  const today = toDayKey(new Date());
  const height = isWide ? 380 : isDesktop ? 320 : 260;
  const faceSize = isDesktop ? 20 : 16;

  const filtered = useMemo(() => (tag ? entries.filter((e) => e.tags.includes(tag)) : entries), [entries, tag]);

  const points = useMemo<DailyPoint[]>(() => {
    if (range === "year") return buildWeeklySeries(filtered, shiftDayKey(today, -7 * 51), today, weekStartsOn);
    const days = range === "month" ? monthDayKeys(month) : dayKeysEnding(today, range === "7" ? 7 : 30);
    return buildDaySeries(filtered, days);
  }, [filtered, range, month, today, weekStartsOn]);

  const target = useMemo(() => points.map((p) => p.average), [points]);
  const values = useAnimatedValues(target, reducedMotion);
  const labels = useMemo(() => xLabels(points, range, width), [points, range, width]);
  const geo = useMemo(() => makeGeometry(width, height, points.length, faceSize), [width, height, points.length, faceSize]);

  const selectedIndex = selectedDay && range !== "year" ? points.findIndex((p) => p.day === selectedDay) : -1;
  const selected = selectedIndex >= 0 ? selectedIndex : null;
  const todayIndex = range === "year" ? null : points.findIndex((p) => p.day === today);
  const tipIndex = canHover ? (hovered ?? selected) : selected;
  const tipPoint = tipIndex !== null ? points[tipIndex] : undefined;

  // "See my chart": select the day, switch to month view, scroll here and flash the card.
  useEffect(() => {
    const focus = shell.chartFocus;
    if (!focus) return;
    setRange("month");
    onSelectDay(focus.day);
    setHighlight(focus.nonce);
    requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shell.chartFocus?.nonce]);

  const logged = points.filter((p) => p.average !== null);
  const avg = mean(logged.map((p) => p.average!));
  const best = [...logged].sort((a, b) => b.average! - a.average!)[0];
  const rangeTitle = range === "month" ? formatMonthTitle(month) : RANGE_OPTIONS.find((r) => r.value === range)!.label.toLowerCase();
  const summary = logged.length
    ? `Rumbo chart for ${rangeTitle}${tag ? `, tag ${tag}` : ""}: ${logged.length} ${range === "year" ? "weeks" : "days"} logged, average ${formatScore(avg!)} (${scoreToLevel(avg!).name}), best ${formatShortDate(best!.day)} at ${formatScore(best!.average!)}.`
    : `Rumbo chart for ${rangeTitle}: no updates yet.`;

  function select(i: number) {
    const p = points[i];
    if (!p) return;
    onSelectDay(range === "year" ? null : p.day);
  }

  function openDay(i: number) {
    const p = points[i];
    if (p && range !== "year" && p.count > 0) shell.openDay(p.day);
  }

  function localX(e: React.PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    if (e.pointerType === "mouse") return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    select(geo.indexAt(localX(e).x));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = localX(e);
    if (e.pointerType === "mouse") {
      setHovered(geo.indexAt(p.x));
      setPointer(p);
    } else if (scrubbing.current) {
      select(geo.indexAt(p.x));
    }
  };
  const onPointerUp = () => {
    scrubbing.current = false;
  };
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Mouse: click opens the day. (Touch taps select via pointerdown.)
    if (lastPointer.current !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const i = geo.indexAt(e.clientX - rect.left);
    select(i);
    openDay(i);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const current = selected ?? (todayIndex !== null && todayIndex >= 0 ? todayIndex : points.length - 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      const next = Math.max(0, Math.min(points.length - 1, (selected === null ? current : current + (e.key === "ArrowLeft" ? -1 : 1))));
      select(next);
      setHovered(null);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selected !== null) openDay(selected);
    } else if (e.key === "Escape" && selected !== null) {
      e.stopPropagation();
      onSelectDay(null);
    }
  };

  const showAllBarLabels = width >= 640 ? points.length <= 14 : false;

  const tooltip = tipPoint && (
    <TooltipBody
      point={tipPoint}
      weekly={range === "year"}
      onOpen={tipPoint.count > 0 && range !== "year" ? () => shell.openDay(tipPoint.day) : undefined}
      compact={canHover}
    />
  );

  // Floating tooltip position (desktop), clamped inside the plot.
  const floatStyle: React.CSSProperties | undefined = (() => {
    if (!canHover || tipIndex === null) return undefined;
    const anchorX = hovered !== null && pointer ? pointer.x : geo.x(tipIndex);
    const tipW = 210;
    const left = Math.max(0, Math.min(width - tipW, anchorX + 14));
    const flip = anchorX + 14 + tipW > width;
    return { left: flip ? Math.max(0, anchorX - tipW - 14) : left, top: 8, width: tipW };
  })();

  return (
    <Card
      ref={cardRef}
      aria-labelledby="rumbo-title"
      className={cn("flex flex-col", highlight > 0 && "animate-highlight", className)}
      key={highlight || undefined}
      data-share-card="rumbo"
    >
      <CardHeader
        title="Rumbo chart"
        titleId="rumbo-title"
        subtitle={canHover ? "Hover to see a day, click to open it" : "Tap the chart to see a day"}
        actions={
          <>
            <IconButton label={showRanges ? "Hide range options" : "Change range"} onClick={() => setShowRanges((v) => !v)} aria-expanded={showRanges}>
              <ZoomIn size={22} aria-hidden />
            </IconButton>
            <ShareButton targetSelector='[data-share-card="rumbo"]' title="My Rumbo chart" />
          </>
        }
      />

      {showRanges && (
        <div className="-mt-1 mb-3 overflow-x-auto fade-x">
          <SegmentedControl label="Chart range" options={RANGE_OPTIONS} value={range} onChange={(r) => setRange(r)} size="sm" />
        </div>
      )}

      <div
        ref={plotRef}
        className="relative touch-pan-y rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-focus"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${summary} Use left and right arrow keys to move between days, Enter to open a day.`}
        aria-describedby="rumbo-table"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          setHovered(null);
          setPointer(null);
        }}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {width > 0 && (
          <div role="img" aria-label={summary}>
            <ChartSvg
              geo={geo}
              values={values}
              labels={labels}
              mode={mode}
              selected={selected}
              hovered={canHover ? hovered : null}
              faceSize={faceSize}
              showAllBarLabels={showAllBarLabels}
              todayIndex={todayIndex !== null && todayIndex >= 0 ? todayIndex : null}
            />
          </div>
        )}
        {canHover && tooltip && floatStyle && (
          <div className="surface pointer-events-none absolute z-10 p-3" style={{ ...floatStyle, borderRadius: 14 }}>
            {tooltip}
          </div>
        )}
      </div>

      {/* Mobile: fixed tooltip card under the chart (not under the finger). */}
      {!canHover && (
        <div className="mt-3 min-h-[60px] rounded-[14px] bg-bg p-3" aria-live="polite">
          {tooltip ?? <p className="text-[13px] font-medium text-ink-soft">Tap or drag across the chart to see a day.</p>}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <SegmentedControl
          label="Chart type"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "line", label: <ChartLine size={18} aria-hidden />, ariaLabel: "Line chart" },
            { value: "bar", label: <BarChart3 size={18} aria-hidden />, ariaLabel: "Bar chart" },
          ]}
        />
        {tag ? (
          <Chip tone="brand" onRemove={() => setTag(null)} removeLabel={`Clear tag ${tag}`} onClick={() => setTagSheet(true)}>
            #{tag}
          </Chip>
        ) : (
          <button
            type="button"
            onClick={() => setTagSheet(true)}
            className="inline-flex min-h-10 items-center gap-1 rounded-full border border-line px-4 text-[13px] font-semibold text-ink hover:bg-bg"
          >
            All goals <ChevronRight size={16} aria-hidden />
          </button>
        )}
      </div>

      <table id="rumbo-table" className="sr-only">
        <caption>Day averages</caption>
        <thead>
          <tr>
            <th scope="col">{range === "year" ? "Week of" : "Day"}</th>
            <th scope="col">Average</th>
            <th scope="col">Updates</th>
          </tr>
        </thead>
        <tbody>
          {points
            .filter((p) => p.average !== null)
            .map((p) => (
              <tr key={p.day}>
                <td>{formatLongDay(p.day)}</td>
                <td>
                  {formatScore(p.average!)} ({scoreToLevel(p.average!).name})
                </td>
                <td>{p.count}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <Sheet open={tagSheet} onClose={() => setTagSheet(false)} title="Filter by tag" variant="panel">
        <ul className="space-y-1">
          <li>
            <TagOption label="All goals" selected={!tag} onClick={() => (setTag(null), setTagSheet(false))} />
          </li>
          {(tags.data ?? []).map((t) => (
            <li key={t.name}>
              <TagOption
                label={`#${t.name}`}
                count={t.count}
                selected={tag === t.name}
                onClick={() => {
                  setTag(t.name);
                  setTagSheet(false);
                }}
              />
            </li>
          ))}
          {tags.data && tags.data.length === 0 && (
            <li className="py-4 text-center text-ink-soft">Tags appear after a few updates.</li>
          )}
        </ul>
      </Sheet>
    </Card>
  );
}

function TagOption({ label, count, selected, onClick }: { label: string; count?: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-12 w-full items-center justify-between rounded-[12px] px-3 text-left text-[15px] font-semibold",
        selected ? "bg-brand-soft text-brand-strong" : "hover:bg-bg",
      )}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-3 text-[13px] text-ink-soft tabular">{count}</span>}
    </button>
  );
}

function TooltipBody({ point, weekly, onOpen, compact }: { point: DailyPoint; weekly: boolean; onOpen?: () => void; compact: boolean }) {
  const level = point.average === null ? null : scoreToLevel(point.average);
  const label = weekly ? `Week of ${formatShortDate(point.day)}` : formatLongDay(point.day);
  return (
    <div className="flex items-center gap-3">
      <FaceIcon level={level?.key ?? null} size={36} decorative />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{label}</p>
        <p className="text-[13px] text-ink-soft">
          {level && point.average !== null ? (
            <>
              <span className="font-semibold tabular" style={{ color: level.textColorVar }}>
                {formatScore(point.average)} {level.name}
              </span>
              {" · "}
              {point.count} update{point.count === 1 ? "" : "s"}
            </>
          ) : (
            "No updates"
          )}
        </p>
      </div>
      {onOpen && !compact && (
        <button
          type="button"
          onClick={onOpen}
          className="min-h-11 shrink-0 rounded-[12px] px-3 text-[13px] font-semibold text-brand-strong hover:bg-brand-soft"
        >
          Open day
        </button>
      )}
    </div>
  );
}
