import { FaceIcon } from "@/components/levels/face-icon";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <FaceIcon level={null} size={72} decorative />
      <p className="mt-4 font-display text-xl font-bold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
