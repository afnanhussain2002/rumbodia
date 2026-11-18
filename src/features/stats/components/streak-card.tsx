"use client";

import { useMemo } from "react";
import { Check, Trophy } from "lucide-react";
import type { Entry } from "@/types";
import { computeStreaks } from "@/lib/stats/streaks";
import { cn } from "@/lib/utils/cn";
import { formatShortWeekday, isoToDayKey, toDayKey } from "@/lib/utils/date";
import { Card, CardHeader } from "@/components/ui/card";
import { ShareButton } from "@/features/stats/components/share-button";
import { Sticker } from "@/components/fun/decor";

export function StreakCard({ entries, className }: { entries: Entry[]; className?: string }) {
  const today = toDayKey(new Date());
  const streak = useMemo(() => computeStreaks(entries.map((e) => isoToDayKey(e.createdAt)), today), [entries, today]);

  return (
    <Card aria-labelledby="streak-title" className={className} data-share-card="streak">
      <CardHeader title="Days in a row" titleId="streak-title" actions={<ShareButton targetSelector='[data-share-card="streak"]' title="My Rumbodia streak" />} />

      <div className="flex items-center gap-3">
        <ol className="relative flex min-w-0 flex-1 items-start justify-between" aria-label="Last five days">
          <span aria-hidden className="absolute top-[22px] right-[22px] left-[22px] h-0.5 bg-line" />
          {streak.lastFiveDays.map((d) => (
            <li key={d.day} className="relative flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full",
                  d.logged ? "bg-brand text-on-brand" : "border-2 border-line bg-empty",
                )}
                role="img"
                aria-label={`${formatShortWeekday(d.day)}: ${d.logged ? "logged" : "not logged"}`}
              >
                {d.logged && <Check size={22} strokeWidth={3} aria-hidden />}
              </span>
              <span className={cn("text-[13px] font-medium", d.day === today ? "font-bold text-brand-strong" : "text-ink-soft")}>
                {formatShortWeekday(d.day)}
              </span>
            </li>
          ))}
        </ol>
        <span className="mb-6 shrink-0" aria-label={`Current streak: ${streak.current} day${streak.current === 1 ? "" : "s"}`}>
          <Sticker className="text-[20px] tabular" rotate={-6}>
            <span aria-hidden>🔥</span>
            {streak.current} {streak.current === 1 ? "day" : "days"}!
          </Sticker>
        </span>
      </div>

      {streak.atRisk && <p className="mt-2 text-[15px] font-medium text-brand-strong">Log today to keep your chain.</p>}
      {!streak.atRisk && streak.current === 0 && streak.longest > 0 && (
        <p className="mt-2 text-[15px] font-medium text-ink-soft">Streak reset. No drama, start a new one today.</p>
      )}

      <div className="-mx-5 mt-4 flex items-center gap-2 border-t border-line px-5 pt-4 text-[15px] font-medium lg:-mx-6 lg:px-6">
        <Trophy size={20} className="text-amber" aria-hidden />
        Longest chain: <span className="font-semibold tabular">{streak.longest}</span>
      </div>
    </Card>
  );
}
