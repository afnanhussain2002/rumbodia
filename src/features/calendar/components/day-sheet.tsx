"use client";

import { Plus } from "lucide-react";
import { scoreToLevel } from "@/lib/levels";
import { formatLongDay, toDayKey } from "@/lib/utils/date";
import { entriesForDay, formatScore, mean } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { SkeletonLines } from "@/components/ui/skeleton";
import { useShell } from "@/components/shell/shell-context";
import { EntryRow } from "@/features/entries/components/entry-row";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";
import { useSettings } from "@/features/settings/hooks/use-settings";

/** The content of a day: big face, date, average, count, and that day's updates. */
export function DayDetail({ day, compactHeader }: { day: string; compactHeader?: boolean }) {
  const { data: all, isLoading } = useAllEntries();
  const shell = useShell();
  const settings = useSettings();
  const entries = entriesForDay(all ?? [], day).reverse();
  const avg = mean(entries.map((e) => e.score));
  const level = avg === null ? null : scoreToLevel(avg);
  const isFuture = day > toDayKey(new Date());

  return (
    // The day's own level colors this sheet, whatever the app mood is.
    <div data-mood={level?.key}>
      <div className="flex items-center gap-4 rounded-[24px] bg-mood-50 p-3">
        <FaceIcon level={level?.key ?? null} size={64} animated label={level ? `${level.name} day` : "No updates"} />
        <div className="min-w-0">
          {!compactHeader && <p className="font-display text-xl font-bold">{formatLongDay(day)}</p>}
          {compactHeader && <h2 className="font-display text-xl font-bold">{formatLongDay(day)}</h2>}
          <p className="text-[15px] text-ink-soft">
            {level && avg !== null ? (
              <>
                <span className="font-semibold tabular" style={{ color: level.textColorVar }}>
                  {level.name}
                  {settings.scoreDisplay === "numbers" && ` ${formatScore(avg)}`}
                </span>
                {" · "}
                {entries.length} update{entries.length === 1 ? "" : "s"}
              </>
            ) : (
              "No updates this day."
            )}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <SkeletonLines />
        ) : entries.length ? (
          <div className="divide-y divide-line">
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </div>
        ) : null}
      </div>

      {!isFuture && (
        <Button
          variant={entries.length ? "secondary" : "primary"}
          className="mt-5 w-full"
          icon={<Plus size={18} aria-hidden />}
          onClick={() => shell.openNewUpdate({ day })}
        >
          Add an update to this day
        </Button>
      )}
    </div>
  );
}

export function DaySheet({ day, onClose }: { day: string | null; onClose: () => void }) {
  return (
    <Sheet open={day !== null} onClose={onClose} title={day ? formatLongDay(day) : "Day"} hideTitle variant="drawer">
      {day && <DayDetail day={day} />}
    </Sheet>
  );
}
