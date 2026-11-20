"use client";

import { useEffect, useState } from "react";
import type { LevelKey } from "@/lib/levels";
import { useReducedMotion } from "@/hooks/use-media-query";
import { THINKING_LINES } from "@/features/mascot/lines";
import { Rumbo } from "@/features/mascot/rumbo";
import { SpeechBubble } from "@/features/mascot/speech-bubble";

const CYCLE: LevelKey[] = ["steady", "rising", "soaring", "slipping", "falling"];

/** While Gemini scores: Rumbo morphs through the shapes with a "Hmm, let me see…" bubble. Never a plain spinner. */
export function ThinkingRumbo({ size = 120 }: { size?: number }) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setTick((t) => t + 1), 650);
    return () => clearInterval(id);
  }, [reduced]);

  const level = CYCLE[tick % CYCLE.length]!;
  const line = THINKING_LINES[Math.floor(tick / 3) % THINKING_LINES.length]!;

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <SpeechBubble tail="bottom" size="sm">
        {line}
      </SpeechBubble>
      <div key={tick} className="animate-think" style={{ width: size, height: size }}>
        <Rumbo level={level} size={size} color="var(--mood-500)" animated={false} limbs decorative />
      </div>
      <span className="sr-only">Reading your update.</span>
    </div>
  );
}
