import { ReactNode } from "react";
import BackButton from "./BackButton";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  back?: boolean;
  actions?: ReactNode;
  className?: string;
}

/**
 * Canonical page header used across learner / manager / admin pages.
 * Renders a full-bleed bar with `border-b bg-card`, inner `max-w-7xl px-6 py-[18px]`,
 * an optional BackButton, eyebrow + H1 + subtitle, and a right-side action slot.
 *
 * The `py-[18px]` value is required to align with the 60px sidebar brand section.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  back,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border bg-card", className)}>
      <div className="mx-auto max-w-7xl px-6 py-[18px]">
        {back && <BackButton />}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
