"use client";

import { scoreToLevel } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { formatLongDay } from "@/lib/utils/date";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";

interface DayCellProps {
  day: string;
  inMonth: boolean;
  average: number | null;
  count: number;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  /** Filter active and this day does not match. */
  faded: boolean;
  onSelect: (day: string) => void;
}

export function DayCell({ day, inMonth, average, count, isToday, isFuture, isSelected, faded, onSelect }: DayCellProps) {
  const level = average === null ? null : scoreToLevel(average);
  const date = Number(day.slice(8));
  const label = `${formatLongDay(day)}: ${level && average !== null ? `${level.name}, ${formatScore(average)}, ${count} update${count === 1 ? "" : "s"}` : isFuture ? "upcoming" : "no updates"}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      disabled={isFuture}
      aria-label={label}
      aria-current={isToday ? "date" : undefined}
      aria-pressed={isSelected}
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 rounded-[18px] py-1.5 transition-opacity",
        "hover:bg-mood-50 disabled:cursor-default disabled:hover:bg-transparent",
        isSelected && "bg-mood-100 hover:bg-mood-100",
        isToday && "ring-2 ring-ink ring-inset",
        faded && "opacity-25",
        !inMonth && !faded && "opacity-40",
      )}
      title={level && average !== null ? `${level.name} (${formatScore(average)})` : undefined}
    >
      {isFuture ? (
        <span className="size-[var(--face)]" aria-hidden />
      ) : (
        <FaceIcon level={level?.key ?? null} size={40} decorative className="size-[var(--face)]" />
      )}
      <span
        className={cn(
          "text-[13px] leading-none whitespace-nowrap tabular sm:text-[14px]",
          isToday ? "font-extrabold text-ink" : "font-medium text-ink",
        )}
      >
        {date}
      </span>
    </button>
  );
}
