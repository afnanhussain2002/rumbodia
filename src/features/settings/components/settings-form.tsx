"use client";

import { useState } from "react";
import Link from "next/link";
import type { Settings, TimeOfDayStarts } from "@/types";
import { APP_VERSION, TIME_OF_DAY_LABELS, TIMES_OF_DAY } from "@/lib/constants";
import { Card, CardHeader } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useMetaQuery } from "@/features/entries/hooks/use-entries-query";
import { useSaveSettings, useSettings } from "@/features/settings/hooks/use-settings";
import { RemindersCard } from "@/features/settings/components/reminders-card";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">{label}</p>
        {hint && <p className="text-[13px] text-ink-soft">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsForm() {
  const settings = useSettings();
  const save = useSaveSettings();
  const set = (patch: Partial<Settings>) => save.mutate(patch);

  return (
    <div className="space-y-4">
      <Card>
        <div className="divide-y divide-line">
          <Row label="Theme">
            <SegmentedControl
              label="Theme"
              size="sm"
              value={settings.theme}
              onChange={(theme) => set({ theme })}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Row>
          <Row label="Week starts on">
            <SegmentedControl
              label="Week starts on"
              size="sm"
              value={String(settings.weekStartsOn) as "0" | "1"}
              onChange={(v) => set({ weekStartsOn: v === "0" ? 0 : 1 })}
              options={[
                { value: "1", label: "Monday" },
                { value: "0", label: "Sunday" },
              ]}
            />
          </Row>
          <Row label="Color follows my mood" hint="The app's color changes with today's level. Off keeps it a calm yellow.">
            <SegmentedControl
              label="Color follows my mood"
              size="sm"
              value={settings.followMood ? "on" : "off"}
              onChange={(v) => set({ followMood: v === "on" })}
              options={[
                { value: "on", label: "On" },
                { value: "off", label: "Off" },
              ]}
            />
          </Row>
          <Row label="Mascot animations" hint="Rumbo's bouncing, blinking and confetti.">
            <SegmentedControl
              label="Mascot animations"
              size="sm"
              value={settings.mascotMotion}
              onChange={(mascotMotion) => set({ mascotMotion })}
              options={[
                { value: "on", label: "On" },
                { value: "reduced", label: "Reduced" },
                { value: "off", label: "Off" },
              ]}
            />
          </Row>
          <Row label="Show scores as" hint="Charts always use the numbers.">
            <SegmentedControl
              label="Show scores as"
              size="sm"
              value={settings.scoreDisplay}
              onChange={(scoreDisplay) => set({ scoreDisplay })}
              options={[
                { value: "numbers", label: "Numbers (+5)" },
                { value: "levels", label: "Levels only" },
              ]}
            />
          </Row>
        </div>
      </Card>

      <TimeBounds starts={settings.timeOfDayStarts} onSave={(timeOfDayStarts) => set({ timeOfDayStarts })} />

      <RemindersCard />

      <AboutCard />
    </div>
  );
}

function TimeBounds({ starts, onSave }: { starts: TimeOfDayStarts; onSave: (s: TimeOfDayStarts) => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Card aria-labelledby="tod-bounds">
      <CardHeader title="Parts of the day" titleId="tod-bounds" subtitle="When each part starts. New updates pick their part from these." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TIMES_OF_DAY.map((part) => (
          <label key={part} className="flex flex-col gap-1 text-[13px] font-semibold text-ink-soft">
            {TIME_OF_DAY_LABELS[part]}
            <input
              type="time"
              value={starts[part]}
              onChange={(e) => {
                const value = e.target.value;
                if (!/^\d{2}:\d{2}$/.test(value)) return;
                const next = { ...starts, [part]: value };
                const unique = new Set(Object.values(next)).size === 4;
                if (!unique) {
                  setError("Each part needs its own start time.");
                  return;
                }
                setError(null);
                onSave(next);
              }}
              className="h-11 rounded-[12px] border border-line bg-card px-3 text-[16px] font-medium text-ink tabular"
            />
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[15px] text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}

export function AboutCard() {
  const meta = useMetaQuery();
  return (
    <Card id="about" aria-labelledby="about-title" className="scroll-mt-24">
      <CardHeader title="About Rumbodia" titleId="about-title" />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
        <dt className="text-ink-soft">Version</dt>
        <dd className="font-semibold tabular">{meta.data?.version ?? APP_VERSION}</dd>
        <dt className="text-ink-soft">Gemini model</dt>
        <dd className="min-w-0 break-words font-semibold">{meta.data?.model ?? "…"}</dd>
      </dl>
      <p className="mt-3 text-[13px] text-ink-soft">
        The model is set with <code className="rounded bg-bg px-1">GEMINI_MODEL</code> in <code className="rounded bg-bg px-1">.env.local</code>.
      </p>
      <Link href="/" className="mt-4 inline-flex min-h-10 items-center text-[15px] font-semibold text-brand-strong hover:underline">
        Visit the Rumbodia home page
      </Link>
    </Card>
  );
}
