import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/**
 * Inline breadcrumb trail used inside <PageHeader>. The last crumb renders as
 * non-interactive emphasised text; earlier crumbs render as muted links.
 */
export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider", className)}
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${c.label}-${i}`}>
            {i > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" aria-hidden />
            )}
            {c.to && !isLast ? (
              <Link
                to={c.to}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? "text-foreground/80" : "text-muted-foreground"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {c.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
