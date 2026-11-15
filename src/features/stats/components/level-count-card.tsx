"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Entry } from "@/types";
import { LEVELS } from "@/lib/levels";
import { countDayLevels, countEntryLevels, totalCount, type LevelCounts } from "@/lib/stats/level-counts";
import { cn } from "@/lib/utils/cn";
import { withParams } from "@/hooks/use-month-param";
import { toMonthKey } from "@/lib/utils/date";
import { FaceIcon } from "@/components/levels/face-icon";
import { Card, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShareButton } from "@/features/stats/components/share-button";

type CountMode = "days" | "updates";

const R = 80;
const STROKE = 18;
const CX = 100;
const CY = 96;
const GAP_PX = 2;

function polar(angle: number, r = R) {
  return { x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) };
}

/** Semicircle donut: segments in level order from left (soaring) to right (falling). */
export function LevelDonut({ counts, total, caption }: { counts: LevelCounts; total: number; caption: string }) {
  const gap = GAP_PX / R; // radians
  let start = Math.PI;
  const segments = LEVELS.map((l) => {
    const share = total ? counts[l.key] / total : 0;
    const sweep = share * Math.PI;
    const seg = { key: l.key, from: start, to: start - sweep, count: counts[l.key] };
    start -= sweep;
    return seg;
  }).filter((s) => s.count > 0);

  return (
    <svg viewBox="0 0 200 112" className="mx-auto block w-full max-w-[300px]" role="img" aria-label={`${total} ${caption}`}>
      <path
        d={`M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none"
        stroke="var(--empty)"
        strokeWidth={STROKE}
        strokeLinecap="butt"
      />
      {segments.map((s, i) => {
        const g = segments.length > 1 ? gap / 2 : 0;
        const a0 = s.from - (i === 0 ? 0 : g);
        const a1 = s.to + (i === segments.length - 1 ? 0 : g);
        if (a0 <= a1) return null;
        const p0 = polar(a0);
        const p1 = polar(a1);
        const large = a0 - a1 > Math.PI ? 1 : 0;
        return (
          <path
            key={s.key}
            d={`M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${R} ${R} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`}
            fill="none"
            stroke={`var(--level-${s.key})`}
            strokeWidth={STROKE}
          />
        );
      })}
      <text x={CX} y={CY - 18} textAnchor="middle" fontSize={34} fontWeight={700} fill="var(--ink)" className="tabular" style={{ fontFamily: "var(--font-display)" }}>
        {total}
      </text>
      <text x={CX} y={CY + 2} textAnchor="middle" fontSize={12} fontWeight={500} fill="var(--ink-soft)">
        {caption}
      </text>
    </svg>
  );
}

interface LevelCountCardProps {
  entries: Entry[];
  month: string;
  className?: string;
  /** Smaller variant for side panels (no header toggle). */
  mini?: boolean;
}

export function LevelCountCard({ entries, month, className, mini }: LevelCountCardProps) {
  const [mode, setMode] = useState<CountMode>("days");
  const counts = useMemo(() => (mode === "days" ? countDayLevels(entries) : countEntryLevels(entries)), [entries, mode]);
  const total = totalCount(counts);
  const shareKey = `level-${mini ? "mini" : "full"}`;

  return (
    <Card aria-labelledby={`${shareKey}-title`} className={className} data-share-card={shareKey}>
      <CardHeader
        title="Level count"
        titleId={`${shareKey}-title`}
        subtitle={mini ? undefined : "Tap a level to see those days"}
        actions={mini ? undefined : <ShareButton targetSelector={`[data-share-card="${shareKey}"]`} title="My Rumbodia levels" />}
      />
      {!mini && (
        <div className="-mt-1 mb-3 flex justify-end" data-share-ignore="">
          <SegmentedControl
            label="Count by"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "days", label: "Days" },
              { value: "updates", label: "Updates" },
            ]}
          />
        </div>
      )}

      <LevelDonut counts={counts} total={total} caption={mode === "days" ? "days logged" : "updates"} />

      <ul className="mt-3 grid grid-cols-5 gap-1">
        {LEVELS.map((l) => {
          const n = counts[l.key];
          return (
            <li key={l.key} className="min-w-0">
              <Link
                href={withParams("/app/entries", { month: month === toMonthKey(new Date()) ? null : month, level: l.key })}
                className={cn(
                  "flex min-h-11 flex-col items-center gap-1 rounded-[12px] py-1.5 hover:bg-bg",
                  n === 0 && "opacity-60",
                )}
                aria-label={`${l.name}: ${n} ${mode === "days" ? (n === 1 ? "day" : "days") : n === 1 ? "update" : "updates"}. Show these days.`}
              >
                <span className="relative">
                  <FaceIcon level={l.key} size={mini ? 36 : 44} decorative />
                  <span
                    className="absolute -top-1.5 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[12px] font-bold text-white tabular ring-2 ring-card"
                    style={{ background: l.colorVar }}
                  >
                    {n}
                  </span>
                </span>
                <span className="w-full truncate text-center text-[12px] font-medium text-ink-soft max-[359px]:hidden sm:text-[13px]">
                  {l.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
