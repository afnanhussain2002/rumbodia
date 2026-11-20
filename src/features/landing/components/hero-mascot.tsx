"use client";

import { LINES, pickLine } from "@/features/mascot/lines";
import { SpeechBubble } from "@/features/mascot/speech-bubble";
import { MoodMark, usePageMood } from "@/components/brand/mood-mark";

/**
 * Hero character: the logo's triangle, wearing the page's mood (shape color and face follow it,
 * just like the Start free button does). Peeks in from the bottom-right edge of the dark panel.
 */
export function HeroMascot() {
  const mood = usePageMood();
  const line = mood ? pickLine(LINES[mood], `hero-${mood}`) : "I’ll keep you honest!";
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -right-8 -bottom-10 z-[1] size-[220px] sm:-right-6 sm:-bottom-16 sm:size-[360px] lg:right-10">
        <MoodMark />
      </div>
      <div className="absolute right-[150px] bottom-[150px] z-[3] hidden md:block lg:right-[300px] lg:bottom-[190px]">
        <SpeechBubble tail="bottom-right" size="lg" className="-rotate-3">
          {line}
        </SpeechBubble>
      </div>
    </>
  );
}
