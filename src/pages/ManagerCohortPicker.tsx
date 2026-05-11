import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Layers, ChevronRight } from "lucide-react";
import BackButton from "@/components/layout/BackButton";
import { useAccountCohorts } from "@/hooks/useManagerCohortData";
import { RATHBONES_COHORT_ID } from "@/data/managerDemoOverlay";

export default function ManagerCohortPicker() {
  const { loading, cohorts } = useAccountCohorts();

  // Always guarantee the demo cohort is reachable
  const list = cohorts.length
    ? cohorts
    : [
        {
          id: RATHBONES_COHORT_ID,
          cohort_code: "cohort.assoc_im.2026_01",
          cohort_title: "Investment Management Readiness — Jan 2026",
          role_cohort_code: "assoc_im",
        },
      ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Cohorts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a cohort to open the manager hub — roster heatmap, AI changes, and CPD.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading cohorts…</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Link
            key={c.id}
            to={`/manager/cohort/${c.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="mb-2 flex items-center justify-between">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{c.cohort_title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.role_cohort_code}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
