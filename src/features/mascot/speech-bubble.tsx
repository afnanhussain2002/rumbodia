import { cn } from "@/lib/utils/cn";

export type TailSide = "bottom-left" | "bottom-right" | "left" | "right" | "bottom";

const TAIL: Record<TailSide, { className: string; rotate: number }> = {
  "bottom-left": { className: "-bottom-[9px] left-7", rotate: 45 },
  "bottom-right": { className: "-bottom-[9px] right-7", rotate: 45 },
  bottom: { className: "-bottom-[9px] left-1/2 -ml-[7px]", rotate: 45 },
  left: { className: "top-1/2 -left-[9px] -mt-[7px]", rotate: 135 },
  right: { className: "top-1/2 -right-[9px] -mt-[7px]", rotate: -45 },
};

interface SpeechBubbleProps {
  children: React.ReactNode;
  /** Where the tail points (towards Rumbo). */
  tail?: TailSide;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Normal case instead of ALL CAPS (for longer text like Gemini's reason). */
  plain?: boolean;
}

const SIZES = {
  sm: "px-3.5 py-2 text-[16px]",
  md: "px-5 py-3 text-[20px]",
  lg: "px-6 py-4 text-[24px]",
};

/** The "GOOD JOB!" bubble: cream, outlined, handwritten. */
export function SpeechBubble({ children, tail = "bottom-left", size = "md", className, plain }: SpeechBubbleProps) {
  return (
    <div className={cn("bubble inline-block max-w-full", SIZES[size], plain && "normal-case", className)}>
      <span className="relative z-[1] block break-words">{children}</span>
      <span aria-hidden className={cn("bubble-tail", TAIL[tail].className)} style={{ transform: `rotate(${TAIL[tail].rotate}deg)` }} />
    </div>
  );
}
