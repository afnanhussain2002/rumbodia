"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { getLevel, scoreToLevel, type LevelKey } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { formatScore } from "@/lib/utils/scores";
import { Confetti } from "@/components/fun/confetti";
import { LINES, pickLine } from "@/features/mascot/lines";
import { Rumbo } from "@/features/mascot/rumbo";
import { SpeechBubble } from "@/features/mascot/speech-bubble";
import { ThinkingRumbo } from "@/features/mascot/thinking-rumbo";

interface Sample {
  level: LevelKey;
  label: string;
  text: string;
  score: number;
  reason: string;
  wins: string[];
  slips: string[];
}

/** Canned answers: the demo never calls Gemini. */
const SAMPLES: Sample[] = [
  {
    level: "soaring",
    label: "Big day",
    text: "1. Ran 5 km, new personal best\n2. Closed 2 paying customers\n3. Read 30 pages",
    score: 9,
    reason: "You beat your running target and grew revenue. This is the version of you your goals are about.",
    wins: ["New 5 km best", "2 paying customers"],
    slips: [],
  },
  {
    level: "rising",
    label: "Good day",
    text: "1. Ran 1 km, did 5 push-ups\n2. Talked with 2 customers\n3. Got 0 new users today",
    score: 5,
    reason: "You moved on two goals today; zero new users is the one to fix.",
    wins: ["Moved your body", "Customer conversations"],
    slips: ["0 new users"],
  },
  {
    level: "steady",
    label: "Meh day",
    text: "1. Answered emails\n2. Short walk at lunch\n3. Skipped the gym",
    score: 0,
    reason: "A mixed day: a little movement and a skipped workout. Nothing lost, nothing gained.",
    wins: ["Short walk"],
    slips: ["Skipped the gym"],
  },
  {
    level: "slipping",
    label: "Wobbly day",
    text: "1. Overslept, skipped my run\n2. Scrolled for 2 hours\n3. Sent one customer email",
    score: -4,
    reason: "Your run and focus slipped, but that one customer email kept a thread alive.",
    wins: ["One customer email"],
    slips: ["Skipped run", "2 hours scrolling"],
  },
  {
    level: "falling",
    label: "Rough day",
    text: "1. Didn't touch the app at all\n2. Junk food all day\n3. Stayed up until 3am",
    score: -8,
    reason: "Nothing moved on your goals and sleep took a hit. Tomorrow, start with one small thing.",
    wins: [],
    slips: ["No work on the app", "Late night"],
  },
];

const GOOD = /\b(ran|run|gym|read|shipped|closed|finished|walk|workout|customers?|users?|wrote|learned|meditat\w*|best|won)\b/gi;
const BAD = /\b(skipp\w*|missed|overslept|didn'?t|scroll\w*|junk|late|tired|sick|nothing|0 new|zero)\b/gi;

/** Very rough word-count guess for custom text (clearly labeled as a demo). */
function guess(text: string): Sample {
  const good = text.match(GOOD)?.length ?? 0;
  const bad = text.match(BAD)?.length ?? 0;
  const score = Math.max(-10, Math.min(10, Math.round((good - bad) * 2.5)));
  const level = scoreToLevel(score).key;
  return {
    level,
    label: "Yours",
    text,
    score,
    reason: "Demo guess from keywords only. Sign up and it gets read properly, against your own goals.",
    wins: [],
    slips: [],
  };
}

type Phase = "idle" | "thinking" | "result";

export function LiveDemo() {
  const [text, setText] = useState(SAMPLES[1]!.text);
  const [result, setResult] = useState<Sample | null>(SAMPLES[1]!);
  const [phase, setPhase] = useState<Phase>("result");
  const [burst, setBurst] = useState(0);
  const [touched, setTouched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once the visitor tries it, the whole landing page takes the result's mood color.
  useEffect(() => {
    if (touched && result && phase === "result") document.documentElement.dataset.mood = result.level;
  }, [touched, result, phase]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      delete document.documentElement.dataset.mood;
    },
    [],
  );

  function score(sample?: Sample) {
    const next = sample ?? SAMPLES.find((s) => s.text === text.trim()) ?? guess(text);
    if (timer.current) clearTimeout(timer.current);
    setTouched(true);
    setPhase("thinking");
    timer.current = setTimeout(() => {
      setResult(next);
      setPhase("result");
      if (next.level === "soaring" || next.level === "rising") setBurst((b) => b + 1);
    }, 1300);
  }

  const level = result ? getLevel(result.level) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Composer */}
      <div className="surface flex flex-col p-5 sm:p-6">
        <p className="font-display text-[24px] font-extrabold">¡Hola! How did it go?</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Sample days">
          {SAMPLES.map((s) => (
            <button
              key={s.level}
              type="button"
              onClick={() => {
                setText(s.text);
                score(s);
              }}
              aria-pressed={result?.level === s.level && result.text === s.text}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-3 text-[14px] font-semibold transition-colors",
                result?.text === s.text ? "border-outline bg-bubble" : "border-line hover:border-outline",
              )}
            >
              <Rumbo level={s.level} size={22} decorative />
              {s.label}
            </button>
          ))}
        </div>
        <label htmlFor="demo-text" className="sr-only">
          Write a sample update
        </label>
        <textarea
          id="demo-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={400}
          className="mt-4 min-h-[150px] w-full flex-1 resize-none rounded-[20px] border-2 border-line bg-bg/60 p-4 text-[16px] leading-relaxed focus:border-mood-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => score()}
          disabled={!text.trim() || phase === "thinking"}
          className="btn-pop mt-4 inline-flex h-12 items-center justify-center rounded-full bg-mood-500 px-6 font-semibold text-mood-ink disabled:opacity-60"
        >
          {phase === "thinking" ? "Reading your update…" : "Score it"}
        </button>
        <p className="mt-2 text-center text-[13px] text-ink-soft">Demo only: canned answers, no AI call.</p>
      </div>

      {/* Rumbo's reaction */}
      <div
        className="relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden rounded-[32px] border border-line bg-mood-100 p-6 text-center"
        aria-live="polite"
      >
        {burst > 0 && <Confetti key={burst} count={44} />}
        {phase === "thinking" || !result || !level ? (
          <ThinkingRumbo size={150} />
        ) : (
          <div key={`${result.level}-${result.score}-${result.text.length}`} className="flex flex-col items-center">
            <SpeechBubble tail="bottom" size="md" className="-rotate-2">
              {pickLine(LINES[result.level], result.text)}
            </SpeechBubble>
            <div className="mt-2 animate-reveal">
              <Rumbo level={result.level} size={170} label={`${level.name}, score ${formatScore(result.score)}`} />
            </div>
            <p className="font-hand text-[24px] uppercase" style={{ color: level.textColorVar }}>
              {level.name}
            </p>
            <p className="score-xl !text-[64px]" style={{ color: level.textColorVar }}>
              {formatScore(result.score)}
            </p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed">{result.reason}</p>
            {(result.wins.length > 0 || result.slips.length > 0) && (
              <ul className="mt-4 flex max-w-sm flex-wrap justify-center gap-1.5">
                {result.wins.map((w) => (
                  <li key={w} className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[13px] font-semibold">
                    <Check size={14} strokeWidth={3} style={{ color: "var(--level-soaring-text)" }} aria-hidden />
                    {w}
                  </li>
                ))}
                {result.slips.map((s) => (
                  <li key={s} className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[13px] font-semibold">
                    <X size={14} strokeWidth={3} style={{ color: "var(--level-falling-text)" }} aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
