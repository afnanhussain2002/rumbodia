"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { tagImpact } from "@/lib/stats/tag-impact";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";
import { Card, CardHeader } from "@/components/ui/card";

export function TagImpactCard({ entries, className }: { entries: Entry[]; className?: string }) {
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => tagImpact(entries), [entries]);
  const visible = showAll ? rows : rows.slice(0, 5);

  return (
    <Card aria-labelledby="tags-title" className={className}>
      <CardHeader title="What lifts you, what drags you" titleId="tags-title" />
      {rows.length === 0 ? (
        <p className="text-[15px] text-ink-soft">Tags appear after a few updates.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {visible.map((r) => {
              const level = scoreToLevel(r.average);
              const pct = Math.min(50, (Math.abs(r.average) / 10) * 50);
              return (
                <li key={r.tag} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <FaceIcon level={level.key} size={22} decorative />
                    <span className="truncate text-[15px] font-semibold">#{r.tag}</span>
                  </div>
                  <span className="text-right text-[15px] tabular">
                    <span className="font-semibold" style={{ color: level.textColorVar }}>
                      {formatScore(r.average)}
                    </span>{" "}
                    <span className="text-[13px] text-ink-soft">
                      ({r.count} update{r.count === 1 ? "" : "s"})
                    </span>
                  </span>
                  {/* Diverging bar from the center. */}
                  <div className="relative col-span-2 h-1.5 rounded-full bg-empty" aria-hidden>
                    <span className="absolute top-[-2px] left-1/2 h-2.5 w-px bg-ink-soft/40" />
                    <span
                      className="absolute top-0 h-1.5 rounded-full"
                      style={{
                        background: level.colorVar,
                        width: `${pct}%`,
                        left: r.average >= 0 ? "50%" : `${50 - pct}%`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {rows.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 min-h-10 text-[15px] font-semibold text-brand-strong hover:underline"
              aria-expanded={showAll}
            >
              {showAll ? "Show top 5" : `Show all (${rows.length})`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
