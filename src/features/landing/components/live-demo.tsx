"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { scoreToLevel } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/hooks/use-media-query";
import { FaceIcon } from "@/components/levels/face-icon";

const TEXT = "1. Ran 1 km, did 5 push-ups\n2. Talked with 2 customers\n3. Got 0 new users today";
/** Static week of day averages; the last one is today's new score. */
const WEEK = [-1, 2, 4, -4, 1, 3];
const TODAY = 5;

type Phase = "typing" | "scoring" | "result";

/** A scripted, looping demo of logging an update. No API calls. */
export function LiveDemo() {
  const reduced = useReducedMotion();
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => !cancelled && fn(), ms));

    function run() {
      setPhase("typing");
      setChars(0);
      for (let i = 1; i <= TEXT.length; i++) at(500 + i * 38, () => setChars(i));
      const typed = 500 + TEXT.length * 38;
      at(typed + 500, () => setPhase("scoring"));
      at(typed + 1900, () => setPhase("result"));
      at(typed + 6500, run);
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced]);

  const shownPhase: Phase = reduced ? "result" : phase;
  const shownText = reduced ? TEXT : TEXT.slice(0, chars);
  const level = scoreToLevel(TODAY);
  const values = shownPhase === "result" ? [...WEEK, TODAY] : [...WEEK, 0];

  return (
    <div className="mx-auto w-full max-w-[320px]" aria-label="Demo: logging an update in Rumbodia" role="img">
      <div className="rounded-[44px] border-[10px] border-ink bg-bg p-3 shadow-2xl" aria-hidden>
        <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-ink" />
        <div className="surface min-h-[430px] overflow-hidden p-4">
          {shownPhase !== "result" ? (
            <div className="flex h-full flex-col gap-3">
              <p className="font-display text-lg font-bold">¡Hola! How did it go?</p>
              <div className="flex gap-1 rounded-full bg-bg p-1 text-[11px] font-semibold">
                {["Morning", "Noon", "Afternoon", "Night"].map((t, i) => (
                  <span key={t} className={cn("flex-1 rounded-full py-1.5 text-center", i === 0 ? "bg-card text-brand-strong shadow-sm" : "text-ink-soft")}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="min-h-[190px] rounded-[14px] border border-line bg-bg/60 p-3 text-[14px] leading-relaxed whitespace-pre-line">
                {shownText}
                {shownPhase === "typing" && <span className="ml-px inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-brand" />}
              </div>
              <div className="mt-auto flex h-11 items-center justify-center gap-2 rounded-[14px] bg-brand text-[14px] font-semibold text-on-brand">
                {shownPhase === "scoring" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Reading your update…
                  </>
                ) : (
                  "Log update"
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center" style={{ background: `color-mix(in srgb, ${level.colorVar} 0%, transparent)` }}>
              <FaceIcon level={level.key} size={76} className="animate-pop" decorative />
              <p className="mt-2 font-display text-xl font-bold" style={{ color: level.textColorVar }}>
                {level.name}
              </p>
              <p className="font-display text-4xl font-bold tabular" style={{ color: level.textColorVar }}>
                +{TODAY}
              </p>
              <p className="mt-2 text-[13px] leading-snug text-ink-soft">You moved on two goals today; zero new users is the one to fix.</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {["exercise", "customers", "users"].map((t) => (
                  <span key={t} className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-ink-soft">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mini Rumbo chart */}
          <svg viewBox="0 0 220 90" className="mt-4 w-full">
            <line x1="0" x2="220" y1="45" y2="45" stroke="var(--line)" />
            {values.map((v, i) => {
              const h = Math.abs(v) * 4;
              const lv = scoreToLevel(v);
              return (
                <rect
                  key={i}
                  x={10 + i * 30}
                  width={18}
                  rx={4}
                  y={v >= 0 ? 45 - h : 45}
                  height={Math.max(1.5, h)}
                  fill={lv.colorVar}
                  style={{ transition: "y 600ms ease-out, height 600ms ease-out" }}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
