"use client";

import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { formatDayCardTitle } from "@/lib/utils/date";
import { formatScore, mean } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";
import { Card } from "@/components/ui/card";
import { EntryRow } from "@/features/entries/components/entry-row";
import { useSettings } from "@/features/settings/hooks/use-settings";

interface DayCardProps {
  day: string;
  /** Entries to show (already filtered), any order. */
  entries: Entry[];
  /** All entries of the day, for the day average. */
  allDayEntries: Entry[];
  onTagClick?: (tag: string) => void;
  activeTag?: string | null;
}

export function DayCard({ day, entries, allDayEntries, onTagClick, activeTag }: DayCardProps) {
  const settings = useSettings();
  const avg = mean(allDayEntries.map((e) => e.score)) ?? 0;
  const level = scoreToLevel(avg);
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const headingId = `day-${day}`;

  return (
    <Card as="article" aria-labelledby={headingId}>
      <header className="-mx-5 mb-4 flex items-center gap-3 border-b border-line px-5 pb-4 lg:-mx-6 lg:px-6">
        <FaceIcon level={level.key} size={32} />
        <h2 id={headingId} className="min-w-0 flex-1 truncate font-display text-lg font-bold">
          {formatDayCardTitle(day)}
        </h2>
        <span className="text-right font-semibold tabular" style={{ color: level.textColorVar }} title={`${level.name}, day average ${formatScore(avg)}`}>
          {settings.scoreDisplay === "numbers" ? formatScore(avg) : level.name}
        </span>
      </header>
      <div className="divide-y divide-line">
        {sorted.map((entry) => (
          <EntryRow key={entry.id} entry={entry} onTagClick={onTagClick} activeTag={activeTag} />
        ))}
      </div>
    </Card>
  );
}
