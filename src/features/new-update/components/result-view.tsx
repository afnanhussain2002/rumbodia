"use client";

import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";
import { Button } from "@/components/ui/button";
import { WinSlipList } from "@/features/entries/components/entry-row";

interface ResultViewProps {
  entry: Entry;
  onSeeChart: () => void;
  onDone: () => void;
}

export function ResultView({ entry, onSeeChart, onDone }: ResultViewProps) {
  const level = scoreToLevel(entry.score);
  const remark = level.key === "soaring" ? "Buen rumbo." : level.key === "falling" ? "Tomorrow is a new rumbo." : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center pt-4 text-center" aria-live="polite">
        {remark && <p className="mb-3 font-display text-lg font-bold text-ink">{remark}</p>}
        <FaceIcon level={level.key} size={96} className="animate-pop" />
        <p className="mt-3 font-display text-2xl font-bold" style={{ color: level.textColorVar }}>
          {level.name}
        </p>
        <p className="big-score mt-1" style={{ color: level.textColorVar }}>
          {formatScore(entry.score)}
        </p>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed break-words">{entry.reason}</p>

        <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-4 text-left">
          <WinSlipList title="Went well" items={entry.wins} />
          <WinSlipList title="Slipped" items={entry.slips} />
        </div>

        {entry.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap justify-center gap-1.5" aria-label="Tags">
            {entry.tags.map((t) => (
              <li key={t} className="rounded-full bg-card/80 px-2.5 py-1 text-[13px] font-medium text-ink-soft">
                #{t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-3 pb-1">
        <Button variant="secondary" size="lg" onClick={onSeeChart}>
          See my chart
        </Button>
        <Button size="lg" onClick={onDone} data-autofocus>
          Done
        </Button>
      </div>
    </div>
  );
}
