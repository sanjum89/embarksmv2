import { Link } from "react-router-dom";
import { Layers, ChevronRight, Users, AlertCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";
import { useAccountCohorts } from "@/hooks/useManagerCohortData";
import { RATHBONES_COHORT_ID, getAllDemoOverlays } from "@/data/managerDemoOverlay";

export default function ManagerCohortPicker() {
  const { loading, cohorts } = useAccountCohorts();
  const eyebrow = useModeEyebrow();

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

        <div className="mb-8 mt-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Cohorts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a cohort to open the manager hub — roster heatmap, AI changes, adaptive paths, and CPD.
          </p>
        </div>

        {/* KPI tiles */}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {/* Cohorts — accent border */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cohorts</span>
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-foreground">{list.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {list.length === 1 ? "active programme" : "active programmes"}
            </p>
          </div>

          {/* Active learners — hero navy tile */}
          <div className="relative overflow-hidden rounded-2xl bg-primary p-6 shadow-lg shadow-primary/20">
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative flex items-center gap-2 text-primary-foreground/70">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Active learners
              </span>
            </div>
            <p className="relative mt-3 font-display text-4xl font-bold text-primary-foreground">
              {learnerCount}
            </p>
            <p className="relative mt-1 text-xs font-medium text-accent">
              across all cohorts
            </p>
          </div>

          {/* Needs attention — accent border */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Needs attention
              </span>
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-foreground">{needsAttn}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {needsAttn === 0 ? "all on track" : "needs follow-up"}
            </p>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading cohorts…</p>}

        {/* Cohort cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const m = metricsFor(c.id);
            const started = m.pct > 0;
            return (
              <Link
                key={c.id}
                to={`/manager/cohort/${c.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
              >
                {/* Top accent strip */}
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-x-100" />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                        {c.role_cohort_code}
                      </span>
                      <h3 className="mt-3 font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {c.cohort_title}
                      </h3>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                        {started ? "Progress" : "Not started"}
                      </span>
                      <span className="font-display text-sm font-bold text-foreground">
                        {m.pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                        style={{ width: `${Math.max(m.pct, started ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {m.learners} learner{m.learners === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Layers className="h-3.5 w-3.5" />
                      {started ? `${m.pct}% complete` : "Awaiting kickoff"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
