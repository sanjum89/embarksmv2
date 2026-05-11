import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { TeamAvatar } from "./Avatar";
import { LearnerStatusBadge } from "@/components/manager-hub/LearnerStatusBadge";
import type { LearnerOverlay } from "@/data/managerDemoOverlay";

export interface RosterEntry {
  employeeId: string;
  name: string;
  title?: string;
  overlay: LearnerOverlay;
  progressPct: number;
  completed: number;
  total: number;
  cpdHint: string;
  cpdTone: "emerald" | "amber" | "rose";
  lastActivity: string;
}

const CPD_TONE: Record<RosterEntry["cpdTone"], string> = {
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

export function RosterRow({
  entry,
  onOpen,
}: {
  entry: RosterEntry;
  onOpen: (employeeId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.employeeId)}
      className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
    >
      <TeamAvatar name={entry.name} size={40} />

      {/* Identity */}
      <div className="min-w-0 flex-1 sm:max-w-[220px]">
        <p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
        <p className="truncate text-xs text-muted-foreground">{entry.title ?? "Learner"}</p>
      </div>

      {/* Status + headline */}
      <div className="hidden min-w-0 flex-1 sm:block">
        <div className="flex items-center gap-2">
          <LearnerStatusBadge status={entry.overlay.status} />
          <span className="truncate text-xs text-muted-foreground">{entry.lastActivity}</span>
        </div>
        <p className="mt-1.5 truncate text-xs text-foreground/70">{entry.overlay.headline}</p>
      </div>

      {/* Progress */}
      <div className="hidden w-[180px] shrink-0 md:block">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-foreground">{entry.progressPct}%</span>
          <span className="text-[11px] text-muted-foreground">
            {entry.completed}/{entry.total} modules
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.max(2, entry.progressPct)}%` }}
          />
        </div>
        <span
          className={cn(
            "mt-2 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
            CPD_TONE[entry.cpdTone]
          )}
        >
          CPD {entry.cpdHint}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
