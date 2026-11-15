"use client";

import { useMemo } from "react";
import type { Entry } from "@/types";
import { TIME_OF_DAY_LABELS } from "@/lib/constants";
import { scoreToLevel } from "@/lib/levels";
import { timeOfDayCaption, timeOfDayStats } from "@/lib/stats/time-of-day";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";
import { Card, CardHeader } from "@/components/ui/card";

export function TimeOfDayCard({ entries, className, compact }: { entries: Entry[]; className?: string; compact?: boolean }) {
  const stats = useMemo(() => timeOfDayStats(entries), [entries]);
  const caption = timeOfDayCaption(stats);

  return (
    <Card aria-labelledby={compact ? undefined : "tod-title"} className={className}>
      <CardHeader title="Time of day" titleId={compact ? undefined : "tod-title"} />
      <ul className="grid grid-cols-4 gap-2">
        {stats.map((s) => {
          const level = s.average === null ? null : scoreToLevel(s.average);
          return (
            <li key={s.part} className="flex min-w-0 flex-col items-center gap-1 text-center">
              <span className="w-full truncate text-[13px] font-semibold text-ink-soft">{TIME_OF_DAY_LABELS[s.part]}</span>
              <FaceIcon level={level?.key ?? null} size={compact ? 32 : 40} label={level ? `${TIME_OF_DAY_LABELS[s.part]}: ${level.name}` : `${TIME_OF_DAY_LABELS[s.part]}: no updates`} />
              <span className="text-[15px] font-semibold tabular" style={{ color: level?.textColorVar }}>
                {s.average === null ? "–" : formatScore(s.average)}
              </span>
              <span className="text-[13px] text-ink-soft tabular">{s.count}×</span>
            </li>
          );
        })}
      </ul>
      {caption && <p className="mt-4 text-[15px] text-ink-soft">{caption}</p>}
    </Card>
  );
}
