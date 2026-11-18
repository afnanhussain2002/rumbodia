"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, TrendingUp, X } from "lucide-react";
import type { Entry } from "@/types";
import { scoreToLevel } from "@/lib/levels";
import { formatScore } from "@/lib/utils/scores";
import { useReducedMotion } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/fun/confetti";
import { useShell } from "@/components/shell/shell-context";
import { LINES, pickLine } from "@/features/mascot/lines";
import { Rumbo } from "@/features/mascot/rumbo";
import { SpeechBubble } from "@/features/mascot/speech-bubble";

interface ResultViewProps {
  entry: Entry;
  onSeeChart: () => void;
  onDone: () => void;
}

/** Counts from 0 to `target` (700ms, ease-out). Jumps straight there with reduced motion. */
function useCountUp(target: number, ms = 700): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setValue(target * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, ms, reduced]);
  return value;
}

export function ResultView({ entry, onSeeChart, onDone }: ResultViewProps) {
  const level = scoreToLevel(entry.score);
  const shell = useShell();
  const shown = useCountUp(entry.score);
  const good = level.key === "soaring" || level.key === "rising";
  const rough = level.key === "slipping" || level.key === "falling";
  const line = pickLine(LINES[level.key], entry.id);

  return (
    // The entry's level overrides the app mood inside this screen.
    <div data-mood={level.key} className="flex h-full flex-col">
      {good && <Confetti />}

      <div className="flex flex-1 flex-col items-center pt-2 text-center" aria-live="polite">
        <SpeechBubble tail="bottom" size="md" className="-rotate-2">
          {line}
        </SpeechBubble>

        <div className="relative mt-3 animate-reveal">
          {rough && <CloudToSun />}
          <Rumbo level={level.key} size={190} label={`${level.name}, score ${formatScore(entry.score)}`} />
        </div>

        <p className="mt-1 font-hand text-[26px] uppercase" style={{ color: level.textColorVar }}>
          {level.name}
        </p>
        <p className="score-xl" style={{ color: level.textColorVar }} aria-label={`Score ${formatScore(entry.score)}`}>
          {formatScore(Math.round(shown))}
        </p>

        <p className="mt-4 max-w-md text-[16px] leading-relaxed break-words">{entry.reason}</p>

        {(entry.wins.length > 0 || entry.slips.length > 0) && (
          <div className="mt-6 w-full max-w-md text-left">
            <h3 className="mb-2 font-display text-[17px] font-bold">What I noticed</h3>
            <ul className="space-y-2">
              {entry.wins.map((w, i) => (
                <TipRow key={`w${i}`} tone="win" text={w} />
              ))}
              {entry.slips.map((s, i) => (
                <TipRow key={`s${i}`} tone="slip" text={s} />
              ))}
            </ul>
          </div>
        )}

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

      <div className="sticky bottom-0 mt-6 space-y-2 pb-1">
        <Button size="lg" onClick={onDone} className="btn-pop w-full" data-autofocus>
          Done
        </Button>
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" icon={<Pencil size={15} aria-hidden />} onClick={() => shell.openNewUpdate({ entry })}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" icon={<TrendingUp size={15} aria-hidden />} onClick={onSeeChart}>
            See my chart
          </Button>
        </div>
      </div>
    </div>
  );
}

/** "Helpful tips" style row: rounded card with a check (win) or a cross (slip). */
function TipRow({ tone, text }: { tone: "win" | "slip"; text: string }) {
  const win = tone === "win";
  return (
    <li className="flex items-start gap-3 rounded-[20px] bg-card/90 px-4 py-3 text-[15px] shadow-[var(--card-shadow)]">
      <span
        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: win ? "var(--level-soaring)" : "var(--level-falling)", color: win ? "var(--level-soaring-ink)" : "var(--level-falling-ink)" }}
      >
        {win ? <Check size={15} strokeWidth={3} aria-hidden /> : <X size={15} strokeWidth={3} aria-hidden />}
      </span>
      <span className="sr-only">{win ? "Went well:" : "Slipped:"}</span>
      <span className="min-w-0 break-words">{text}</span>
    </li>
  );
}

/** A small rain cloud that clears into a sun after ~2s. Supportive, never mocking. */
function CloudToSun() {
  return (
    <svg aria-hidden viewBox="0 0 80 60" width="86" height="64" className="absolute -top-9 -right-12 z-10">
      <g className="animate-sun-in">
        <circle cx="40" cy="30" r="12" fill="#F2C230" />
        <g stroke="#F2C230" strokeWidth="4" strokeLinecap="round">
          <path d="M40 6v6M40 48v6M16 30h6M58 30h6M23 13l4 4M53 43l4 4M23 47l4-4M53 17l4-4" />
        </g>
      </g>
      <g className="animate-cloud-away">
        <path d="M18 30 C18 22 26 17 33 20 C36 13 47 12 51 20 C59 18 66 24 64 31 C64 36 60 38 56 38 L24 38 C19 38 16 35 18 30 Z" fill="#B9C2CC" />
        <path d="M28 44 l-2 6 M40 44 l-2 6 M52 44 l-2 6" stroke="#5aa9e6" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
