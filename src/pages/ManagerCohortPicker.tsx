import { Link } from "react-router-dom";
import { Layers, ChevronRight, Users, AlertCircle } from "lucide-react";
import BackButton from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/badge";
import { useAccountCohorts } from "@/hooks/useManagerCohortData";
import { RATHBONES_COHORT_ID, getAllDemoOverlays } from "@/data/managerDemoOverlay";

export default function ManagerCohortPicker() {
  const { loading, cohorts } = useAccountCohorts();

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

  const overlays = getAllDemoOverlays();
  const learnerCount = overlays.length;
  const needsAttn = overlays.filter(
    (o) => o.status === "at_risk" || o.status === "needs_check_in"
  ).length;

  const tiles = [
    { label: "Cohorts", value: list.length, icon: Layers },
    { label: "Active learners", value: learnerCount, icon: Users },
    { label: "Needs attention", value: needsAttn, icon: AlertCircle },
  ];

  // Per-cohort metrics — for the demo cohort, attribute all learners; otherwise zero.
  const metricsFor = (cohortId: string) => {
    if (cohortId === RATHBONES_COHORT_ID && overlays.length) {
      const total = overlays.length;
      const completedCells = overlays.reduce(
        (acc, o) => acc + o.cells.filter((c) => c.status === "completed").length,
        0
      );
      const totalCells = overlays.reduce((acc, o) => acc + o.cells.length, 0) || 1;
      const pct = Math.round((completedCells / totalCells) * 100);
      return { learners: total, pct };
    }
    return { learners: 0, pct: 0 };
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <BackButton />

        <div className="mb-6 mt-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Cohorts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a cohort to open the manager hub — roster heatmap, AI changes, adaptive paths, and CPD.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 sm:max-w-2xl">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.label}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wide">{t.label}</span>
                </div>
                <p className="mt-1 font-display text-xl font-bold text-foreground">{t.value}</p>
              </div>
            );
          })}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading cohorts…</p>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const m = metricsFor(c.id);
            return (
              <Link
                key={c.id}
                to={`/manager/cohort/${c.id}`}
                className="group block rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {c.cohort_title}
                    </p>
                    <Badge variant="outline" className="mt-1.5 text-[10px]">
                      {c.role_cohort_code}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {m.learners} learner{m.learners === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    {m.pct}% complete
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
