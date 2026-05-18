import { ReactNode } from "react";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import { useRouteCrumbs } from "./useModeEyebrow";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Optional breadcrumb trail. If omitted, derived from the current route. */
  breadcrumbs?: Crumb[];
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** @deprecated no-op — retained so legacy call sites compile during sweep. */
  eyebrow?: string;
  /** @deprecated no-op — breadcrumbs replace the back button. */
  back?: boolean;
}

/**
 * Canonical compact page header used across learner / manager / admin pages.
 *
 * Anatomy (single source of truth — matches Team Dashboard):
 *   Row 1: breadcrumb trail (auto-derived from route) | [actions]
 *   Row 2: H1 title — text-2xl font-display bold
 *   Row 3: optional one-line subtitle (text-sm muted)
 *
 * Height target: ~56px without subtitle, ~72px with subtitle.
 * No eyebrow, no in-page back button. Mode/section is conveyed by the first
 * breadcrumb (Team Dashboard, Cohorts, People Graph, …).
 */
export default function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  const autoCrumbs = useRouteCrumbs();
  const crumbs = breadcrumbs ?? autoCrumbs;

  return (
    <div className={cn("border-b border-border bg-card", className)}>
      <div className="mx-auto max-w-7xl px-6 py-3">
        {(crumbs.length > 0 || actions) && (
          <div className="flex items-center justify-between gap-4 min-h-[18px]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
            </div>
            {actions && (
              <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight truncate">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
