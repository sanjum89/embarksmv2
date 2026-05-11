import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LearnerStatus } from "@/data/managerDemoOverlay";

const TONE: Record<LearnerStatus, string> = {
  rising_star: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  on_track: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  needs_check_in: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  at_risk: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const LABEL: Record<LearnerStatus, string> = {
  rising_star: "Rising star",
  on_track: "On track",
  needs_check_in: "Check in",
  at_risk: "At risk",
};

export function LearnerStatusBadge({ status, className }: { status?: LearnerStatus | null; className?: string }) {
  if (!status) return <Badge variant="outline" className={cn("text-[11px] font-normal", className)}>No data</Badge>;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-normal", TONE[status], className)}>
      {LABEL[status]}
    </Badge>
  );
}
