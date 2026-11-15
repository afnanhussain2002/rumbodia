"use client";

import { useMemo } from "react";
import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { dayAverages } from "@/lib/stats/series";
import { daysInMonth, formatLongDay, toDayKey } from "@/lib/utils/date";
import { formatScore } from "@/lib/utils/scores";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Year in faces: 12 rows × 31 columns of small level dots. */
export function YearGrid({ year, entries, onSelect }: { year: number; entries: Entry[]; onSelect: (day: string) => void }) {
  const averages = useMemo(() => dayAverages(entries), [entries]);
  const today = toDayKey(new Date());

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-separate" style={{ borderSpacing: 2 }}>
        <caption className="sr-only">Year {year} in faces</caption>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Month
            </th>
            {Array.from({ length: 31 }, (_, i) => (
              <th key={i} scope="col" className="text-center text-[10px] font-medium text-ink-soft tabular">
                {(i + 1) % 5 === 0 || i === 0 ? i + 1 : <span className="sr-only">{i + 1}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MONTHS.map((name, m) => {
            const key = `${year}-${String(m + 1).padStart(2, "0")}`;
            const n = daysInMonth(key);
            return (
              <tr key={name}>
                <th scope="row" className="pr-1 text-left text-[12px] font-semibold text-ink-soft">
                  {name}
                </th>
                {Array.from({ length: 31 }, (_, d) => {
                  if (d >= n) return <td key={d} />;
                  const day = `${key}-${String(d + 1).padStart(2, "0")}`;
                  const avg = averages.get(day);
                  const level = avg === undefined ? null : scoreToLevel(avg);
                  const future = day > today;
                  return (
                    <td key={d} className="p-0">
                      <button
                        type="button"
                        disabled={future}
                        onClick={() => onSelect(day)}
                        aria-label={`${formatLongDay(day)}: ${level && avg !== undefined ? `${level.name} ${formatScore(avg)}` : future ? "upcoming" : "no updates"}`}
                        title={level && avg !== undefined ? `${day}: ${level.name} (${formatScore(avg)})` : day}
                        className="block aspect-square w-full min-w-[7px] rounded-full disabled:opacity-30"
                        style={{ background: level ? level.colorVar : "var(--empty)" }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
