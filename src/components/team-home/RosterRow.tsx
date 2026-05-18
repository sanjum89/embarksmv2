import { ChevronRight, Hand } from "lucide-react";
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

export function RosterRow({
  entry,
  onOpen,
  onOpenRaisedHand,
}: {
  entry: RosterEntry;
  onOpen: (employeeId: string) => void;
  onOpenRaisedHand?: (employeeId: string, actionId: string) => void;
}) {
  const raisedHands = entry.overlay.actions.filter((a) => a.group === "raised_hand");
  const latestHand = raisedHands[0];
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
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">
            <LearnerStatusBadge status={entry.overlay.status} />
          </div>
          {latestHand && onOpenRaisedHand && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onOpenRaisedHand(entry.employeeId, latestHand.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenRaisedHand(entry.employeeId, latestHand.id);
                }
              }}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
            >
              <Hand className="h-3 w-3" />
              Hand raised{raisedHands.length > 1 ? ` ×${raisedHands.length}` : ""}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{entry.lastActivity}</span>
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
