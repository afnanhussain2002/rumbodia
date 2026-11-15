import { LEVELS } from "@/lib/levels";
import { FaceIcon } from "@/components/levels/face-icon";

/** The five faces with names and score ranges. */
export function LevelLegend({ size = 44 }: { size?: number }) {
  return (
    <ul className="grid grid-cols-5 gap-2 sm:gap-4">
      {LEVELS.map((l) => (
        <li key={l.key} className="flex min-w-0 flex-col items-center gap-2 text-center">
          <FaceIcon level={l.key} size={size} />
          <span className="text-sm font-semibold" style={{ color: l.textColorVar }}>
            {l.name}
          </span>
          <span className="text-[13px] font-medium text-ink-soft tabular">{l.range}</span>
        </li>
      ))}
    </ul>
  );
}
