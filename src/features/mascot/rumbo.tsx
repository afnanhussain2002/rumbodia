"use client";

import { useId } from "react";
import { getLevel, type LevelKey } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";
import { SHAPES, type RumboShape } from "@/features/mascot/shapes";

export type RumboSize = "xs" | "sm" | "md" | "lg" | number;

const SIZE_PX: Record<Exclude<RumboSize, number>, number> = { xs: 24, sm: 40, md: 96, lg: 220 };

export interface RumboProps {
  level: LevelKey;
  size?: RumboSize;
  /** Idle loop + blinking. Defaults on for md and up. */
  animated?: boolean;
  /** Arms, legs, sparkles / rain cloud. Defaults on for md and up. */
  limbs?: boolean;
  /** Pause the idle loop until hovered (wrap in a `.group`). */
  hoverOnly?: boolean;
  /** Body color. Defaults to the level color; pass "currentColor" to inherit (e.g. text-mood-500). */
  color?: string;
  /** Accessible name. Omit with `decorative`. */
  label?: string;
  decorative?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const INK = "var(--face-ink)";
const line = { stroke: INK, strokeWidth: 3.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

/** "Rumbo", the mascot. One component; shape, color and expression come from the level. */
export function Rumbo({
  level,
  size = "md",
  animated,
  limbs,
  hoverOnly,
  color,
  label,
  decorative,
  className,
  style,
}: RumboProps) {
  const px = typeof size === "number" ? size : SIZE_PX[size];
  const big = px >= 80;
  const withLimbs = limbs ?? big;
  const anim = animated ?? big;
  const shape = SHAPES[level];
  const id = useId();
  const blinkDelay = `${(hash(id) % 40) / 10}s`;

  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label ?? `${getLevel(level).name}` };

  return (
    <svg
      viewBox={withLimbs ? "-22 -24 144 140" : "2 4 96 96"}
      width={px}
      height={px}
      className={cn("shrink-0 overflow-visible", `rumbo-${level}`, anim && "rumbo-anim", hoverOnly && "rumbo-hover", className)}
      style={{ color: color ?? `var(--level-${level})`, ["--blink-delay" as string]: blinkDelay, ...style }}
      {...a11y}
    >
      {withLimbs && <Fx level={level} />}
      <g className="rumbo-body">
        {withLimbs && <Limbs level={level} shape={shape} />}
        <path
          d={shape.d}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={shape.stroke}
          strokeLinejoin="round"
        />
        {shape.gloss && px >= 32 && (
          <ellipse
            cx={shape.gloss.cx}
            cy={shape.gloss.cy}
            rx={shape.gloss.rx}
            ry={shape.gloss.ry}
            transform={`rotate(${shape.gloss.rotate} ${shape.gloss.cx} ${shape.gloss.cy})`}
            fill="#fff"
            opacity={0.35}
          />
        )}
        <Face level={level} shape={shape} />
      </g>
    </svg>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Face({ level, shape }: { level: LevelKey; shape: RumboShape }) {
  const { eyeY: ey, mouthY: my, eyeGap: g } = shape;
  const cx = 50;
  const lx = cx - g;
  const rx = cx + g;

  return (
    <g>
      {/* Eyes (blink as a group) */}
      <g className="rumbo-eyes">
        {level === "soaring" ? (
          <>
            {/* ^ ^ happy closed eyes */}
            <path d={`M${lx - 5} ${ey + 2} Q${lx} ${ey - 6} ${lx + 5} ${ey + 2}`} {...line} />
            <path d={`M${rx - 5} ${ey + 2} Q${rx} ${ey - 6} ${rx + 5} ${ey + 2}`} {...line} />
          </>
        ) : level === "steady" ? (
          <>
            {/* Calm, half-closed: a lid line over a small pupil */}
            <path d={`M${lx - 5} ${ey} L${lx + 5} ${ey}`} {...line} />
            <path d={`M${rx - 5} ${ey} L${rx + 5} ${ey}`} {...line} />
            <ellipse cx={lx} cy={ey + 2.6} rx={2.6} ry={2} fill={INK} />
            <ellipse cx={rx} cy={ey + 2.6} rx={2.6} ry={2} fill={INK} />
          </>
        ) : (
          <>
            <ellipse cx={lx} cy={ey} rx={3.4} ry={4.4} fill={INK} />
            <ellipse cx={rx} cy={ey} rx={3.4} ry={4.4} fill={INK} />
            <circle cx={lx + 1.2} cy={ey - 1.6} r={1.1} fill="#fff" />
            <circle cx={rx + 1.2} cy={ey - 1.6} r={1.1} fill="#fff" />
          </>
        )}
      </g>

      {/* Brows: worried (inner ends up) on bad days */}
      {(level === "slipping" || level === "falling") && (
        <>
          <path d={`M${lx - 6} ${ey - 8} L${lx + 3} ${ey - (level === "falling" ? 12 : 10)}`} {...line} strokeWidth={3} />
          <path d={`M${rx + 6} ${ey - 8} L${rx - 3} ${ey - (level === "falling" ? 12 : 10)}`} {...line} strokeWidth={3} />
        </>
      )}

      {/* Mouth */}
      {level === "soaring" && (
        <>
          <path d={`M${cx - 11} ${my - 2} Q${cx} ${my + 16} ${cx + 11} ${my - 2} Z`} fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <path d={`M${cx - 5} ${my + 6} Q${cx} ${my + 2} ${cx + 5} ${my + 6} Q${cx} ${my + 9} ${cx - 5} ${my + 6} Z`} fill="#ff7a9a" />
        </>
      )}
      {level === "rising" && <path d={`M${cx - 8} ${my - 1} Q${cx} ${my + 8} ${cx + 8} ${my - 1}`} {...line} />}
      {level === "steady" && <path d={`M${cx - 6} ${my} Q${cx} ${my + 3} ${cx + 6} ${my}`} {...line} />}
      {level === "slipping" && <path d={`M${cx - 6} ${my + 2} Q${cx} ${my - 3} ${cx + 6} ${my + 2}`} {...line} />}
      {level === "falling" && (
        <>
          <path d={`M${cx - 8} ${my + 4} Q${cx} ${my - 5} ${cx + 8} ${my + 4}`} {...line} />
          {/* A tear */}
          <path d={`M${lx} ${ey + 6} q-2.6 4.6 0 6.4 q2.6 -1.8 0 -6.4 Z`} fill="#8fd3ff" />
        </>
      )}

      {/* Blush on good days */}
      {(level === "soaring" || level === "rising") && (
        <>
          <ellipse cx={lx - 5} cy={ey + 8} rx={4} ry={2.4} fill="#ff7a9a" opacity={0.45} />
          <ellipse cx={rx + 5} cy={ey + 8} rx={4} ry={2.4} fill="#ff7a9a" opacity={0.45} />
        </>
      )}
    </g>
  );
}

/** Stick arms and legs, posed per level (drawn behind the body). */
function Limbs({ level, shape }: { level: LevelKey; shape: RumboShape }) {
  const { lx, rx, y } = shape.arm;
  const LIMB = "var(--limb-ink)";
  const limb = { ...line, stroke: LIMB, strokeWidth: 4 };
  const hand = (x: number, yy: number) => <circle cx={x} cy={yy} r={3.4} fill={LIMB} />;

  const arms: Record<LevelKey, React.ReactNode> = {
    soaring: (
      <>
        <path d={`M${lx} ${y} Q${lx - 12} ${y - 8} ${lx - 16} ${y - 24}`} {...limb} />
        {hand(lx - 16, y - 24)}
        <path d={`M${rx} ${y} Q${rx + 12} ${y - 8} ${rx + 16} ${y - 24}`} {...limb} />
        {hand(rx + 16, y - 24)}
      </>
    ),
    rising: (
      <>
        <path d={`M${lx} ${y} Q${lx - 10} ${y + 4} ${lx - 14} ${y + 14}`} {...limb} />
        {hand(lx - 14, y + 14)}
        <path d={`M${rx} ${y} Q${rx + 12} ${y - 2} ${rx + 16} ${y - 14}`} {...limb} />
        {/* thumbs up */}
        <rect x={rx + 12} y={y - 20} width={8} height={8} rx={3} fill={LIMB} />
        <path d={`M${rx + 16} ${y - 20} L${rx + 16} ${y - 27}`} {...limb} strokeWidth={3.6} />
      </>
    ),
    steady: (
      <>
        <path d={`M${lx} ${y} Q${lx - 8} ${y + 6} ${lx - 8} ${y + 16}`} {...limb} />
        {hand(lx - 8, y + 16)}
        <path d={`M${rx} ${y} Q${rx + 8} ${y + 6} ${rx + 8} ${y + 16}`} {...limb} />
        {hand(rx + 8, y + 16)}
      </>
    ),
    slipping: (
      <>
        <path d={`M${lx} ${y} Q${lx - 10} ${y - 6} ${lx - 18} ${y - 2}`} {...limb} />
        {hand(lx - 18, y - 2)}
        <path d={`M${rx} ${y} Q${rx + 10} ${y - 6} ${rx + 18} ${y - 2}`} {...limb} />
        {hand(rx + 18, y - 2)}
      </>
    ),
    falling: (
      <>
        <path d={`M${lx} ${y} Q${lx - 6} ${y + 10} ${lx - 8} ${y + 22}`} {...limb} />
        {hand(lx - 8, y + 22)}
        <path d={`M${rx} ${y} Q${rx + 6} ${y + 10} ${rx + 8} ${y + 22}`} {...limb} />
        {hand(rx + 8, y + 22)}
      </>
    ),
  };

  return (
    <g>
      {arms[level]}
      {shape.legs.x.map((x, i) => (
        <g key={x}>
          <path d={`M${x} ${shape.legs.y - 4} L${x + (i === 0 ? -2 : 2)} ${shape.legs.y + 10}`} {...limb} />
          <path d={`M${x + (i === 0 ? -2 : 2)} ${shape.legs.y + 10} l${i === 0 ? -6 : 6} 0`} {...limb} />
        </g>
      ))}
    </g>
  );
}

/** Sparkles for great days, a little rain cloud for rough ones. */
function Fx({ level }: { level: LevelKey }) {
  if (level === "soaring") {
    const star = (x: number, y: number, s: number) =>
      `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;
    return (
      <g aria-hidden>
        <path className="rumbo-sparkle" d={star(-6, 4, 7)} fill="#F2C230" />
        <path className="rumbo-sparkle" d={star(108, 0, 6)} fill="#E84393" />
        <path className="rumbo-sparkle" d={star(110, 70, 5)} fill="#2F6FE4" />
      </g>
    );
  }
  if (level === "falling") {
    return (
      <g aria-hidden className="rumbo-fx">
        <path
          d="M30 -6 C30 -14 38 -19 45 -16 C48 -22 58 -23 62 -16 C69 -18 76 -12 74 -5 C74 0 70 2 66 2 L34 2 C30 2 28 -1 30 -6 Z"
          fill="#B9C2CC"
        />
        <path className="rumbo-drop" d="M40 6 l-2 5" stroke="#5aa9e6" strokeWidth={3} strokeLinecap="round" />
        <path className="rumbo-drop" d="M52 6 l-2 5" stroke="#5aa9e6" strokeWidth={3} strokeLinecap="round" />
        <path className="rumbo-drop" d="M64 6 l-2 5" stroke="#5aa9e6" strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

/** An empty day: a faint dotted circle the same footprint as a small Rumbo. */
export function RumboEmpty({ size = 40, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={cn("shrink-0", className)} style={style} aria-hidden>
      <circle cx="20" cy="20" r="17" fill="none" stroke="var(--ink-soft)" strokeOpacity={0.45} strokeWidth="2" strokeDasharray="1 4.2" strokeLinecap="round" />
    </svg>
  );
}
