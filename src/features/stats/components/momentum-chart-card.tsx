"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Entry } from "@/types";
import { buildMomentumSeries, niceTicks } from "@/lib/stats/momentum";
import { cn } from "@/lib/utils/cn";
import { dayKeysEnding, formatLongDay, formatShortDate, monthDayKeys, toDayKey } from "@/lib/utils/date";
import { formatScore } from "@/lib/utils/scores";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { Card, CardHeader } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { ShareButton } from "@/features/stats/components/share-button";

type View = "daily" | "cumulative";
type Range = "month" | "7" | "30";

const VIEWS: { value: View; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "cumulative", label: "Cumulative" },
];
const RANGES: { value: Range; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

const HEIGHT = 240;
const PAD = { left: 40, right: 14, top: 14, bottom: 28 };
const TIP_W = 190;

interface Props {
  month: string;
  entries: Entry[];
  className?: string;
}

function Pill({ label, ...props }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[14px] font-semibold text-ink hover:bg-bg focus-visible:outline-2 focus-visible:outline-focus"
    >
      {label}
      <ChevronDown size={16} aria-hidden />
    </button>
  );
}

const fmtTick = (t: number) => (t < 0 ? `−${Math.abs(t)}` : String(t));

export function MomentumChartCard({ month, entries, className }: Props) {
  const [view, setView] = useState<View>("cumulative");
  const [range, setRange] = useState<Range>("month");
  const [active, setActive] = useState<number | null>(null);
  const [plotRef, { width }] = useResizeObserver<HTMLDivElement>();
  const gradientId = useId();
  const today = toDayKey(new Date());

  const points = useMemo(() => {
    const all = range === "month" ? monthDayKeys(month) : dayKeysEnding(today, Number(range));
    // Don't draw the future: the running total stops at today.
    const days = all.filter((d) => d <= today);
    return buildMomentumSeries(entries, days.length ? days : [all[0]!]);
  }, [entries, range, month, today]);

  const values = useMemo(() => points.map((p) => p[view]), [points, view]);
  const ticks = useMemo(() => niceTicks(Math.min(...values), Math.max(...values)), [values]);
  const yMin = ticks[0]!;
  const yMax = ticks[ticks.length - 1]!;

  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const last = points.length - 1;
  const x = (i: number) => PAD.left + (last === 0 ? plotW / 2 : (i / last) * plotW);
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin || 1)) * plotH;

  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(last).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;

  // Evenly spaced x labels, never crowding the last one.
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotW / 70))));
  const showLabel = (i: number) => i % every === 0 && (last - i >= every * 0.6 || i === last);

  const total = points[last]!.cumulative;
  const loggedDays = points.filter((p) => p.count > 0).length;
  const viewLabel = VIEWS.find((v) => v.value === view)!.label;
  const rangeLabel = RANGES.find((r) => r.value === range)!.label;
  const activePoint = active !== null ? points[active] : undefined;
  const summary = `${viewLabel} momentum, ${rangeLabel.toLowerCase()}: net ${formatScore(total)} across ${loggedDays} logged ${loggedDays === 1 ? "day" : "days"}.`;

  function indexAt(clientX: number, el: HTMLElement) {
    if (last === 0) return 0;
    const px = clientX - el.getBoundingClientRect().left;
    return Math.max(0, Math.min(last, Math.round(((px - PAD.left) / plotW) * last)));
  }

  return (
    <Card aria-labelledby="momentum-title" className={cn("flex flex-col", className)} data-share-card="momentum">
      <CardHeader
        title="Momentum"
        titleId="momentum-title"
        subtitle="Your update scores, added up"
        actions={<ShareButton targetSelector='[data-share-card="momentum"]' title="My Rumbodia momentum" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            label="Chart view"
            checkable
            items={VIEWS.map((v) => ({ key: v.value, label: v.label, text: v.label, selected: v.value === view, onSelect: () => setView(v.value) }))}
            trigger={(p) => <Pill {...p} label={viewLabel} />}
          />
          <Dropdown
            label="Chart range"
            checkable
            items={RANGES.map((r) => ({ key: r.value, label: r.label, text: r.label, selected: r.value === range, onSelect: () => setRange(r.value) }))}
            trigger={(p) => <Pill {...p} label={rangeLabel} />}
          />
        </div>
        <p className="text-right">
          <span className="font-display block text-[28px] leading-none font-bold tabular text-ink">{formatScore(total)}</span>
          <span className="text-[13px] font-medium text-ink-soft">net · {rangeLabel.toLowerCase()}</span>
        </p>
      </div>

      <div
        ref={plotRef}
        className="relative touch-pan-y rounded-xl outline-none select-none focus-visible:outline-2 focus-visible:outline-focus"
        style={{ height: HEIGHT }}
        tabIndex={0}
        role="group"
        aria-label={`${summary} Use left and right arrow keys to move between days.`}
        onPointerMove={(e) => setActive(indexAt(e.clientX, e.currentTarget))}
        onPointerDown={(e) => setActive(indexAt(e.clientX, e.currentTarget))}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            setActive((a) => Math.max(0, Math.min(last, (a ?? last) + (e.key === "ArrowLeft" ? -1 : 1))));
          } else if (e.key === "Escape") setActive(null);
        }}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} className="block" role="img" aria-label={summary}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => {
              const zeroLine = t === 0 && yMin < 0;
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={width - PAD.right}
                    y1={y(t)}
                    y2={y(t)}
                    stroke={zeroLine ? "var(--ink-soft)" : "var(--line)"}
                    strokeOpacity={zeroLine ? 0.5 : 1}
                    strokeDasharray={zeroLine ? "4 4" : undefined}
                  />
                  <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fontWeight={500} fill="var(--ink-soft)" className="tabular">
                    {fmtTick(t)}
                  </text>
                </g>
              );
            })}

            {last > 0 && <path d={area} fill={`url(#${gradientId})`} />}
            <path d={path} fill="none" stroke="var(--brand)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            {points.length <= 31 &&
              points.map((p, i) => (p.count > 0 ? <circle key={p.day} cx={x(i)} cy={y(values[i]!)} r={3} fill="var(--brand)" /> : null))}

            {points.map((p, i) =>
              showLabel(i) ? (
                <text
                  key={p.day}
                  x={x(i)}
                  y={HEIGHT - 8}
                  textAnchor={i === 0 && last > 0 ? "start" : i === last && last > 0 ? "end" : "middle"}
                  fontSize={12}
                  fontWeight={p.day === today ? 700 : 500}
                  fill={p.day === today ? "var(--brand)" : "var(--ink-soft)"}
                  className="tabular"
                >
                  {formatShortDate(p.day)}
                </text>
              ) : null,
            )}

            {active !== null && (
              <g>
                <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--brand)" strokeOpacity={0.35} />
                <circle cx={x(active)} cy={y(values[active]!)} r={6} fill="var(--card)" stroke="var(--brand)" strokeWidth={3} />
              </g>
            )}
          </svg>
        )}
        {activePoint && active !== null && (
          <div
            className="surface pointer-events-none absolute top-2 z-10 p-3"
            style={{ borderRadius: 14, width: TIP_W, left: Math.max(0, Math.min(width - TIP_W, x(active) + (x(active) > width / 2 ? -TIP_W - 12 : 12))) }}
          >
            <p className="text-[13px] font-semibold text-ink">{formatLongDay(activePoint.day)}</p>
            <p className="text-[13px] text-ink-soft">
              <span className="font-semibold tabular text-brand-strong">{formatScore(activePoint.daily)} day</span>
              {" · "}
              <span className="tabular">{formatScore(activePoint.cumulative)} total</span>
            </p>
            <p className="text-[12px] text-ink-soft">{activePoint.count ? `${activePoint.count} update${activePoint.count === 1 ? "" : "s"}` : "No updates"}</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-[13px] font-medium text-ink-soft">Daily adds up each day&rsquo;s scores. Cumulative keeps a running total.</p>

      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Daily</th>
            <th scope="col">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{formatLongDay(p.day)}</td>
              <td>{formatScore(p.daily)}</td>
              <td>{formatScore(p.cumulative)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
