import type { LevelKey } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { MoodMark } from "@/components/brand/mood-mark";
import { SpeechBubble } from "@/features/mascot/speech-bubble";

interface InkHeroProps {
  children: React.ReactNode;
  /** The mascot peeking in from the bottom-right edge. */
  level?: LevelKey;
  /** Line in the bubble next to the mascot. */
  bubble?: string;
  className?: string;
  /** Mascot size in px. */
  mascotSize?: number;
}

/**
 * The dark panel from the reference's first screen: huge type, highlight words in the mood color,
 * and the logo's triangle with the level's face, cut off at the bottom-right corner.
 */
export function InkHero({ children, level = "steady", bubble, className, mascotSize = 300 }: InkHeroProps) {
  return (
    <section className={cn("ink-hero px-6 py-10 sm:px-10 sm:py-14", className)}>
      <div className="relative z-[2] max-w-[620px]">{children}</div>
      <div aria-hidden className="pointer-events-none absolute -right-14 -bottom-16 z-[1] hidden sm:block" style={{ width: mascotSize, height: mascotSize }}>
        <MoodMark level={level} />
      </div>
      {bubble && (
        <div
          className="absolute z-[3] hidden sm:block"
          style={{ right: mascotSize * 0.55, bottom: mascotSize * 0.42 }}
        >
          <SpeechBubble tail="bottom-right" size="md" className="-rotate-3">
            {bubble}
          </SpeechBubble>
        </div>
      )}
    </section>
  );
}

/**
 * "WORD **WORD** WORD": highlighted words in the mood color (on the dark hero panel).
 * `marker` = on light backgrounds, where yellow text would be unreadable: a mood-colored highlighter instead.
 */
export function Hl({ children, marker }: { children: React.ReactNode; marker?: boolean }) {
  if (marker) {
    return <span className="rounded-[0.18em] bg-mood-500 box-decoration-clone px-[0.12em] text-mood-ink">{children}</span>;
  }
  return <span className="text-mood-500">{children}</span>;
}
