import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cn("shimmer rounded-xl", className)} style={style} />;
}

/** A card-shaped placeholder: a title bar and a body block of the given height. */
export function SkeletonCard({ height = 160, className, label = "Loading" }: { height?: number; className?: string; label?: string }) {
  return (
    <div className={cn("surface p-5 lg:p-6", className)} role="status" aria-label={label}>
      <Skeleton className="mb-4 h-6 w-40" />
      <Skeleton style={{ height }} />
    </div>
  );
}

/** Three shimmering text lines. */
export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${100 - i * 18}%` }} />
      ))}
    </div>
  );
}
