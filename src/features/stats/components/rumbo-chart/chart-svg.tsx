"use client";

import { useId, useMemo } from "react";
import { LEVELS, levelMidpoint, scoreToLevel } from "@/lib/levels";
import { splitByLevel, splitRuns, type XY } from "@/lib/stats/series";
import { formatScore } from "@/lib/utils/scores";
import { FaceIcon } from "@/components/levels/face-icon";

export type ChartMode = "line" | "bar";
/** Y axis style: level faces, or plain score numbers (+10 … −10). */
export type ChartAxis = "faces" | "numbers";

/** Score ticks for the numeric axis. */
export const SCORE_TICKS = [10, 5, 0, -5, -10] as const;

export interface ChartGeometry {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  band: number;
  x: (i: number) => number;
  y: (score: number) => number;
  indexAt: (px: number) => number;
}

/** `gutter` is the width reserved for the Y axis (face size, or label width). */
export function makeGeometry(width: number, height: number, count: number, gutter: number): ChartGeometry {
  const left = gutter + 12;
  const right = 6;
  const top = 12;
  const bottom = 26;
  const plotW = Math.max(1, width - left - right);
  const plotH = Math.max(1, height - top - bottom);
  const band = plotW / Math.max(1, count);
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    band,
    x: (i) => left + (i + 0.5) * band,
    y: (s) => top + ((10 - s) / 20) * plotH,
    indexAt: (px) => Math.max(0, Math.min(count - 1, Math.floor((px - left) / band))),
  };
}

interface ChartSvgProps {
  geo: ChartGeometry;
  values: (number | null)[];
  labels: (string | null)[];
  mode: ChartMode;
  selected: number | null;
  hovered: number | null;
  faceSize: number;
  showAllBarLabels: boolean;
  /** Index of "today" (brand tick), if visible. */
  todayIndex: number | null;
  /** Default "faces". */
  axis?: ChartAxis;
}

function pathFor(points: XY[], geo: ChartGeometry) {
  return points.map((p, i) => `${i ? "L" : "M"}${geo.x(p.x).toFixed(2)} ${geo.y(p.y).toFixed(2)}`).join(" ");
}

export function ChartSvg({ geo, values, labels, mode, selected, hovered, faceSize, showAllBarLabels, todayIndex, axis = "faces" }: ChartSvgProps) {
  const gradientId = useId();
  const runs = useMemo(() => splitRuns(values), [values]);
  const zeroY = geo.y(0);
  const bottomY = geo.y(-10);

  return (
    <svg width={geo.width} height={geo.height} className="block select-none" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y axis: score numbers and a grid line at each tick… */}
      {axis === "numbers" &&
        SCORE_TICKS.map((t) => {
          const y = geo.y(t);
          return (
            <g key={t}>
              <line
                x1={geo.left}
                x2={geo.width - geo.right}
                y1={y}
                y2={y}
                stroke={t === 0 ? "var(--ink-soft)" : "var(--line)"}
                strokeOpacity={t === 0 ? 0.45 : 1}
                strokeDasharray={t === 0 ? "4 4" : undefined}
                strokeWidth={1}
              />
              <text x={geo.left - 8} y={y + 4} textAnchor="end" fontSize={12} fontWeight={500} fill="var(--ink-soft)" className="tabular">
                {formatScore(t)}
              </text>
            </g>
          );
        })}
      {/* …or a face and a grid line at each level. */}
      {axis === "faces" && LEVELS.map((l) => {
        const y = geo.y(levelMidpoint(l.key));
        return (
          <g key={l.key}>
            <line x1={geo.left} x2={geo.width - geo.right} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} />
            <foreignObject x={2} y={y - faceSize / 2} width={faceSize} height={faceSize}>
              <FaceIcon level={l.key} size={faceSize} decorative />
            </foreignObject>
          </g>
        );
      })}
      {mode === "bar" && (
        <line x1={geo.left} x2={geo.width - geo.right} y1={zeroY} y2={zeroY} stroke="var(--ink-soft)" strokeOpacity={0.5} strokeWidth={1} />
      )}

      {/* Hover / selection column */}
      {[hovered, selected].map((i, k) =>
        i === null ? null : (
          <rect
            key={k}
            x={geo.x(i) - geo.band / 2}
            y={geo.top}
            width={geo.band}
            height={bottomY - geo.top}
            fill="var(--brand)"
            opacity={k === 1 ? 0.08 : 0.05}
            rx={4}
          />
        ),
      )}

      {mode === "line" ? (
        <g>
          {runs.map((run, r) =>
            run.length > 1 ? (
              <path
                key={`a${r}`}
                d={`${pathFor(run, geo)} L${geo.x(run[run.length - 1]!.x)} ${bottomY} L${geo.x(run[0]!.x)} ${bottomY} Z`}
                fill={`url(#${gradientId})`}
              />
            ) : null,
          )}
          {runs.flatMap((run, r) =>
            run.length === 1
              ? [
                  <circle
                    key={`d${r}`}
                    cx={geo.x(run[0]!.x)}
                    cy={geo.y(run[0]!.y)}
                    r={3.5}
                    fill={scoreToLevel(run[0]!.y).colorVar}
                  />,
                ]
              : splitByLevel(run).map((seg, s) => (
                  <path
                    key={`s${r}-${s}`}
                    d={pathFor(seg.points, geo)}
                    fill="none"
                    stroke={`var(--level-${seg.level})`}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )),
          )}
          {[hovered, selected].map((i, k) => {
            if (i === null) return null;
            const v = values[i];
            if (v === null || v === undefined) return null;
            return (
              <circle
                key={`p${k}`}
                cx={geo.x(i)}
                cy={geo.y(v)}
                r={k === 1 ? 6 : 5}
                fill="var(--card)"
                stroke={scoreToLevel(v).colorVar}
                strokeWidth={3}
              />
            );
          })}
        </g>
      ) : (
        <g>
          {values.map((v, i) => {
            if (v === null) return null;
            const w = Math.max(3, Math.min(geo.band * 0.62, 22));
            const y = geo.y(v);
            const top = Math.min(y, zeroY);
            const h = Math.max(1.5, Math.abs(y - zeroY));
            const level = scoreToLevel(v);
            const showLabel = showAllBarLabels || i === selected;
            return (
              <g key={i}>
                <rect
                  x={geo.x(i) - w / 2}
                  y={top}
                  width={w}
                  height={h}
                  rx={Math.min(4, w / 2)}
                  fill={level.colorVar}
                  opacity={selected !== null && selected !== i ? 0.55 : 1}
                />
                {showLabel && (
                  <text
                    x={geo.x(i)}
                    y={v >= 0 ? top - 5 : top + h + 13}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--ink)"
                    className="tabular"
                  >
                    {formatScore(v)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* X axis labels */}
      {labels.map((label, i) =>
        label ? (
          <text
            key={i}
            x={geo.x(i)}
            y={geo.height - 8}
            textAnchor="middle"
            fontSize={12}
            fontWeight={i === todayIndex ? 700 : 500}
            fill={i === todayIndex ? "var(--brand)" : "var(--ink-soft)"}
            className="tabular"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
