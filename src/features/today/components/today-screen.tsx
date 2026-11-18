"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Flame, Plus } from "lucide-react";
import type { Goal } from "@/types";
import { TIME_OF_DAY_LABELS } from "@/lib/constants";
import { computeStreaks } from "@/lib/stats/streaks";
import { isoToDayKey, timeOfDayForDate, toDayKey } from "@/lib/utils/date";
import { entriesForDay, formatScore } from "@/lib/utils/scores";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useShell } from "@/components/shell/shell-context";
import { Hl, InkHero } from "@/components/fun/ink-hero";
import { Sticker } from "@/components/fun/decor";
import { WeekStrip } from "@/components/fun/week-strip";
import { EntryRow } from "@/features/entries/components/entry-row";
import { useAllEntries } from "@/features/entries/hooks/use-entries-query";
import { GoalIcon } from "@/features/goals/components/goal-icons";
import { useGoalsQuery } from "@/features/goals/hooks/use-goals";
import { EMPTY_LINES, LINES, pickLine } from "@/features/mascot/lines";
import { Rumbo } from "@/features/mascot/rumbo";
import { SpeechBubble } from "@/features/mascot/speech-bubble";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useCurrentMood, type CurrentMood } from "@/features/theme/use-current-mood";

export function TodayScreen() {
  const { user } = useUser();
  const shell = useShell();
  const settings = useSettings();
  const all = useAllEntries();
  const goals = useGoalsQuery();
  const mood = useCurrentMood();

  const now = new Date();
  const today = toDayKey(now);
  const part = timeOfDayForDate(now, settings.timeOfDayStarts);
  const entries = useMemo(() => all.data ?? [], [all.data]);
  const todays = useMemo(() => entriesForDay(entries, today).reverse(), [entries, today]);
  const streak = useMemo(() => computeStreaks(entries.map((e) => isoToDayKey(e.createdAt)), today), [entries, today]);

  const name = user?.firstName?.trim() || "there";
  const dateLine = now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

  const companion = (
    <Companion
      mood={mood}
      todayCount={todays.length}
      streak={streak.current}
      seed={`${today}-${part}`}
      part={part}
      goals={goals.data ?? []}
    />
  );

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-6">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[clamp(34px,4vw,44px)] leading-none font-extrabold tracking-[-0.02em]">
              Hey, {name}!
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-ink-soft">
              {dateLine} · {TIME_OF_DAY_LABELS[part].toLowerCase()}
            </p>
          </div>
        </div>

        <div className="xl:hidden">{companion}</div>

        <Card className="p-3 sm:p-4 lg:p-4" aria-label="This week">
          {all.isLoading ? (
            <Skeleton className="h-[92px] rounded-[20px]" />
          ) : (
            <WeekStrip entries={entries} weekStartsOn={settings.weekStartsOn} onSelect={shell.openDay} />
          )}
        </Card>

        <section aria-labelledby="today-updates">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="today-updates" className="card-title">
              Today&rsquo;s updates
            </h2>
            {todays.length > 0 && (
              <Button size="sm" variant="secondary" icon={<Plus size={16} aria-hidden />} onClick={() => shell.openNewUpdate()}>
                Add another
              </Button>
            )}
          </div>

          {all.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
            </div>
          ) : all.isError ? (
            <Card>
              <p role="alert" className="text-danger">
                Could not load your log. {(all.error as Error).message}
              </p>
              <Button variant="secondary" className="mt-4" onClick={() => void all.refetch()}>
                Try again
              </Button>
            </Card>
          ) : todays.length === 0 ? (
            <InkHero level={mood?.level.key ?? "steady"} bubble={entries.length ? "I'm all ears!" : "Hi! I'm Rumbo."} mascotSize={240} className="min-h-[300px]">
              <p className="font-display text-[clamp(30px,4vw,46px)] leading-[0.95] font-extrabold tracking-[-0.02em] uppercase">
                Nothing yet today.
                <br />
                Which way is <Hl>it going?</Hl>
              </p>
              <p className="mt-4 max-w-sm text-[16px] text-cream/75">
                Write a short numbered list. I&rsquo;ll read it against your goals and score it from −10 to +10.
              </p>
              <button
                type="button"
                onClick={() => shell.openNewUpdate()}
                className={buttonClass("primary", "lg", "btn-pop mt-7 !border-cream")}
                aria-keyshortcuts="N"
              >
                <Plus size={20} aria-hidden /> {entries.length ? "Log today's first update" : "Log your first update"}
              </button>
            </InkHero>
          ) : (
            <ul className="space-y-3">
              {todays.map((entry) => (
                <li key={entry.id}>
                  <Card as="article" className="lift p-4 sm:p-5 lg:p-5">
                    <EntryRow entry={entry} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <GoalsRow goals={goals.data ?? []} loading={goals.isLoading} />
      </div>

      <aside className="hidden xl:block" aria-label="Rumbo">
        <div className="sticky top-24">{companion}</div>
      </aside>
    </div>
  );
}

function Companion({
  mood,
  todayCount,
  streak,
  seed,
  part,
  goals,
}: {
  mood: CurrentMood | null;
  todayCount: number;
  streak: number;
  seed: string;
  part: keyof typeof EMPTY_LINES;
  goals: Goal[];
}) {
  const level = mood?.level.key ?? "steady";
  const hasToday = mood?.source === "today";
  let line: string;
  if (hasToday) line = pickLine(LINES[level], seed);
  else if (goals.length > 0 && part !== "night") line = `Today's a good day for: ${pickLine(goals.map((g) => g.title), seed)}`;
  else line = pickLine(EMPTY_LINES[part], seed);

  return (
    <section
      aria-label="Rumbo, your companion"
      className="relative overflow-hidden rounded-[32px] border border-line bg-mood-100 p-5 sm:p-6 xl:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
        <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row-reverse sm:justify-end xl:flex-col xl:items-center">
          <SpeechBubble tail="bottom-left" size="sm" className="max-w-[260px] sm:mb-10 xl:mb-0 xl:self-end" plain={line.length > 40}>
            {line}
          </SpeechBubble>
          <Rumbo
            level={level}
            size={150}
            color={mood ? undefined : "var(--mood-500)"}
            label={mood ? `Rumbo is ${mood.level.name.toLowerCase()} today` : "Rumbo"}
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:w-[280px] xl:w-auto">
          <div className="rounded-[20px] bg-card p-4">
            <dt className="text-[13px] font-semibold text-ink-soft">{hasToday ? "Today" : mood ? "Yesterday" : "Today"}</dt>
            <dd className="mt-1 font-display text-[34px] leading-none font-extrabold tabular" style={{ color: mood ? mood.level.textColorVar : undefined }}>
              {mood ? formatScore(mood.average) : "–"}
            </dd>
            <dd className="mt-1 text-[13px] font-semibold text-ink-soft">
              {mood ? `${mood.level.name} · ${todayCount || mood.count} update${(todayCount || mood.count) === 1 ? "" : "s"}` : "No score yet"}
            </dd>
          </div>
          <div className="rounded-[20px] bg-card p-4">
            <dt className="text-[13px] font-semibold text-ink-soft">Streak</dt>
            <dd className="mt-1 flex items-center gap-1 font-display text-[34px] leading-none font-extrabold tabular">
              <Flame size={26} className="text-[#F28C28]" aria-hidden />
              {streak}
            </dd>
            <dd className="mt-1 text-[13px] font-semibold text-ink-soft">day{streak === 1 ? "" : "s"} in a row</dd>
          </div>
        </dl>
      </div>
      {streak >= 3 && (
        <Sticker className="absolute top-4 right-4 text-[13px] sm:hidden xl:inline-flex" rotate={6}>
          {streak} days!
        </Sticker>
      )}
    </section>
  );
}

function GoalsRow({ goals, loading }: { goals: Goal[]; loading: boolean }) {
  const sorted = [...goals].sort((a, b) => a.order - b.order);

  return (
    <section aria-labelledby="today-goals">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="today-goals" className="card-title">
          Your goals
        </h2>
        <Link href="/app/more/goals" className="inline-flex min-h-10 items-center gap-1 text-[15px] font-semibold text-mood-strong hover:underline">
          Edit <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      {loading ? (
        <Skeleton className="h-20 rounded-[24px]" />
      ) : sorted.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Rumbo level="rising" size={56} limbs={false} decorative />
          <p className="flex-1 text-[15px]">Add up to 10 goals so I can score your updates fairly.</p>
          <Link href="/app/more/goals" className={buttonClass("primary", "md")}>
            Add goals
          </Link>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {sorted.map((g) => (
              <li key={g.id} className="surface lift flex min-w-0 items-center gap-3 p-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mood-100 text-mood-strong">
                  <GoalIcon name={g.icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{g.title}</span>
                  {g.target && (
                    <span className="mt-1 inline-block rounded-full bg-bg px-2.5 py-0.5 text-[12px] font-semibold text-ink-soft">{g.target}</span>
                  )}
                </span>
              </li>
          ))}
        </ul>
      )}
    </section>
  );
}
