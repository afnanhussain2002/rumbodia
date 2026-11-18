"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "@/hooks/use-media-query";

const COLORS = ["#E84393", "#2F6FE4", "#F2C230", "#3FA34D", "#F28C28", "#8B5CF6"];
type Shape = "triangle" | "circle" | "star" | "square" | "squiggle";
const SHAPES: Shape[] = ["triangle", "circle", "star", "square", "squiggle"];

interface Piece {
  id: number;
  left: number;
  size: number;
  color: string;
  shape: Shape;
  delay: number;
  dur: number;
  dx: number;
  spin: number;
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    size: 8 + Math.random() * 10,
    color: COLORS[id % COLORS.length]!,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)]!,
    delay: Math.random() * 0.35,
    dur: 1.2 + Math.random() * 0.8,
    dx: (Math.random() - 0.5) * 160,
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
  }));
}

function PieceSvg({ shape, color }: { shape: Shape; color: string }) {
  switch (shape) {
    case "triangle":
      return <path d="M10 2 L19 18 L1 18 Z" fill={color} />;
    case "circle":
      return <circle cx="10" cy="10" r="8" fill={color} />;
    case "square":
      return <rect x="3" y="3" width="14" height="14" rx="2" fill={color} />;
    case "star":
      return <path d="M10 1 Q10 10 19 10 Q10 10 10 19 Q10 10 1 10 Q10 10 10 1 Z" fill={color} />;
    case "squiggle":
      return <path d="M2 12 Q6 4 10 12 T18 12" stroke={color} strokeWidth="3.4" strokeLinecap="round" fill="none" />;
  }
}

/** One burst of 40–60 pieces over the whole screen. Only for wins. Mount it to fire; it never loops. */
export function Confetti({ count = 54 }: { count?: number }) {
  const reduced = useReducedMotion();
  const [pieces] = useState(() => makePieces(count));
  if (reduced || typeof document === "undefined") return null;
  return createPortal(
    <div aria-hidden className="confetti-layer pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      {pieces.map((p) => (
        <svg
          key={p.id}
          viewBox="0 0 20 20"
          width={p.size}
          height={p.size}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              "--delay": `${p.delay}s`,
              "--dur": `${p.dur}s`,
              "--dx": `${p.dx}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        >
          <PieceSvg shape={p.shape} color={p.color} />
        </svg>
      ))}
    </div>,
    document.body,
  );
}
