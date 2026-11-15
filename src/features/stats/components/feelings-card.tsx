"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Entry } from "@/types";
import { feelingPatterns, type FeelingStat } from "@/lib/stats/feelings";
import { scoreToLevel } from "@/lib/levels";
import { formatScore } from "@/lib/utils/scores";
import { Card, CardHeader } from "@/components/ui/card";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";

function Column({ title, icon, color, rows, empty }: { title: string; icon: React.ReactNode; color: string; rows: FeelingStat[]; empty: string }) {
  return (
    <div className="min-w-0">
      <h3 className="flex items-center gap-1.5 text-[15px] font-semibold" style={{ color }}>
        {icon}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-[15px] text-ink-soft">{empty}</p>
      ) : (
        <ol className="mt-2 space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 break-words text-[15px] font-medium">{r.label}</span>
              <span className="shrink-0 text-[13px] text-ink-soft tabular">
                {r.count}× · avg{" "}
                <span className="font-semibold" style={{ color: scoreToLevel(r.average).textColorVar }}>
                  {formatScore(r.average)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** What the user told us lifts or lowers their motivation and confidence, with the average score on those days. */
export function FeelingsCard({ entries, className }: { entries: Entry[]; className?: string }) {
  const shell = useShell();
  const patterns = useMemo(() => feelingPatterns(entries, 5), [entries]);
  const none = patterns.boosts.length === 0 && patterns.drains.length === 0;

  return (
    <Card aria-labelledby="feelings-title" className={className}>
      <CardHeader
        title="Your motivation sources"
        titleId="feelings-title"
        subtitle="What you said lifts your confidence, and what pulls it down"
      />
      {none ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-prose text-[15px] text-ink-soft">
            When you log an update, open &ldquo;What moved you today?&rdquo; and tell us what boosted or lowered your motivation. Gemini will use it to give you more personal reads and tips.
          </p>
          <Button variant="secondary" onClick={() => shell.openNewUpdate()}>
            Log an update
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <Column title="Lifts you" icon={<TrendingUp size={16} aria-hidden />} color="var(--level-soaring-text)" rows={patterns.boosts} empty="Nothing yet. Add what gave you motivation." />
          <Column title="Pulls you down" icon={<TrendingDown size={16} aria-hidden />} color="var(--level-falling-text)" rows={patterns.drains} empty="Nothing yet. Add what lowered it." />
        </div>
      )}
    </Card>
  );
}
