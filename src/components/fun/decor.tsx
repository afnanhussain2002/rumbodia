import { cn } from "@/lib/utils/cn";

/** 2–3 big soft rounded squares behind the layout, in the mood's blob color. Decorative. */
export function BackgroundBlobs({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <span className="blob" style={{ width: 520, height: 520, top: -180, right: -140, ["--r" as string]: "18deg" }} />
      <span className="blob" style={{ width: 380, height: 380, bottom: -160, left: -120, ["--r" as string]: "-14deg", animationDelay: "-20s" }} />
      <span className="blob opacity-70" style={{ width: 220, height: 220, top: "42%", right: "28%", ["--r" as string]: "30deg", animationDelay: "-40s" }} />
    </div>
  );
}

/** Outlined, hard-shadow label ("BEST VALUE", "12 DAYS!"). */
export function Sticker({
  children,
  tone = "mood",
  rotate = -4,
  className,
}: {
  children: React.ReactNode;
  tone?: "mood" | "cream" | "ink";
  rotate?: number;
  className?: string;
}) {
  const tones = {
    mood: "bg-mood-500 text-mood-ink",
    cream: "bg-bubble text-ink",
    ink: "bg-ink-fixed text-cream",
  };
  return (
    <span className={cn("sticker px-3 py-1.5 text-[15px]", tones[tone], className)} style={{ transform: `rotate(${rotate}deg)` }}>
      {children}
    </span>
  );
}

/** Hand-drawn wavy underline. Uses the mood color by default. */
export function Squiggle({ className, width = 120 }: { className?: string; width?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 120 14" width={width} height={(width * 14) / 120} className={cn("text-mood-500", className)}>
      <path
        d="M2 8 Q9 1 16 8 T30 8 T44 8 T58 8 T72 8 T86 8 T100 8 T114 8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Three little doodle strokes ("energy lines") like the reference's headline accent. */
export function Sparks({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 30 30" width="30" height="30" className={cn("text-mood-500", className)}>
      <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
        <path d="M6 14 L2 10" />
        <path d="M14 8 L14 2" />
        <path d="M22 14 L27 10" />
      </g>
    </svg>
  );
}
