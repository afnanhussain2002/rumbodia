import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card({ as: Tag = "section", className, ...rest }, ref) {
  return <Tag ref={ref as never} className={cn("surface min-w-0 p-5 lg:p-6", className)} {...rest} />;
});

interface CardHeaderProps {
  title: React.ReactNode;
  titleId?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, titleId, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 id={titleId} className="card-title">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] font-medium text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="-mr-2 -mt-2 flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
