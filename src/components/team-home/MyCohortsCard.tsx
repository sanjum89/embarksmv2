import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { RATHBONES_COHORT_ID } from "@/data/managerDemoOverlay";

export interface CohortItem {
  id: string;
  title: string;
  code: string;
  learnerCount: number;
  progressPct: number;
}

export function MyCohortsCard({ cohorts }: { cohorts: CohortItem[] }) {
  const list: CohortItem[] = cohorts.length
    ? cohorts
    : [
        {
          id: RATHBONES_COHORT_ID,
          title: "Investment Management Readiness — Jan 2026",
          code: "assoc_im · demo",
          learnerCount: 9,
          progressPct: 42,
        },
      ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">My cohorts</h2>
          <p className="text-xs text-muted-foreground">Programmes you steward</p>
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-2 p-3">
        {list.map((c) => (
          <Link
            key={c.id}
            to={`/manager/cohort/${c.id}`}
            className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">{c.title}</p>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {c.learnerCount}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.code}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(2, c.progressPct)}%` }}
                />
              </div>
              <span className="text-[11px] tabular-nums text-muted-foreground">{c.progressPct}%</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
