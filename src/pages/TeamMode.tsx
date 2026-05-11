import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Inbox, MessageSquarePlus, Sparkles, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/layout/BackButton";
import { useAccountCohorts } from "@/hooks/useManagerCohortData";
import { getAllDemoOverlays, RATHBONES_COHORT_ID } from "@/data/managerDemoOverlay";
import { LearnerStatusBadge } from "@/components/manager-hub/LearnerStatusBadge";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";
import { COHORT_MODULES_FALLBACK } from "@/data/managerDemoOverlay";

export default function TeamMode() {
  const { cohorts } = useAccountCohorts();
  const overlays = getAllDemoOverlays();
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = overlays.find((o) => o.employeeId === openId) ?? null;

  const kpis = useMemo(() => {
    const learners = overlays.length;
    const atRisk = overlays.filter((o) => o.status === "at_risk" || o.status === "needs_check_in").length;
    const stars = overlays.filter((o) => o.status === "rising_star").length;
    const pending = overlays.reduce(
      (acc, o) => acc + o.actions.filter((a) => a.severity !== "low").length + o.pathChanges.filter((c) => c.needs_approval).length,
      0
    );
    return { learners, atRisk, stars, pending };
  }, [overlays]);

  const ctas = overlays.flatMap((o) => o.actions.map((a) => ({ ...a, name: o.employeeId })));

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Team Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your team at a glance — risks, rising stars, and what to do next.</p>
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Learners", value: kpis.learners },
          { label: "Rising stars", value: kpis.stars },
          { label: "At risk", value: kpis.atRisk },
          { label: "Pending approvals", value: kpis.pending },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Talent signals */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Talent Signals</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {overlays
              .filter((o) => o.status === "rising_star" || o.status === "at_risk")
              .map((o) => (
                <button
                  key={o.employeeId}
                  type="button"
                  onClick={() => setOpenId(o.employeeId)}
                  className="flex w-full items-start justify-between gap-2 rounded-md border border-border p-2 text-left hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{o.employeeId}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.headline}</p>
                  </div>
                  <LearnerStatusBadge status={o.status} />
                </button>
              ))}
          </div>
        </Card>

        {/* Recommended CTAs */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Recommended actions</p>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-2">
            {ctas.slice(0, 5).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpenId(a.employeeId)}
                className="flex w-full items-start gap-2 rounded-md border border-border p-2 text-left hover:bg-muted/40"
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    a.severity === "high"
                      ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
                      : a.severity === "medium"
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {a.severity}
                </Badge>
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                </div>
              </button>
            ))}
            {ctas.length === 0 && <p className="text-sm text-muted-foreground">Nothing pressing right now.</p>}
          </div>
          <Button asChild size="sm" variant="ghost" className="mt-3 w-full justify-between">
            <Link to="/action-centre">
              Open Action Centre
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </Card>

        {/* Cohorts */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Cohorts I manage</p>
          <div className="space-y-2">
            {cohorts.length === 0 && <p className="text-sm text-muted-foreground">No active cohorts.</p>}
            {cohorts.map((c) => (
              <Link
                key={c.id}
                to={`/manager/cohort/${c.id}`}
                className="block rounded-md border border-border p-3 hover:bg-muted/40"
              >
                <p className="text-sm font-medium text-foreground">{c.cohort_title}</p>
                <p className="text-xs text-muted-foreground">{c.role_cohort_code}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => toast.success("1:1 scheduled in Teams (demo)")}>
          <CalendarPlus className="mr-1 h-3 w-3" /> Schedule 1:1
        </Button>
        <Button size="sm" variant="outline" onClick={() => toast.success("Cohort check-in posted (demo)")}>
          <MessageSquarePlus className="mr-1 h-3 w-3" /> Send check-in
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/action-centre"><Inbox className="mr-1 h-3 w-3" /> Action Centre</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to={`/manager/cohort/${RATHBONES_COHORT_ID}`}>Open Associate IM cohort →</Link>
        </Button>
      </div>

      <LearnerDrawer
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
        learner={selected ? { employeeId: selected.employeeId, name: selected.employeeId } : null}
        overlay={selected}
        modules={COHORT_MODULES_FALLBACK.map((m) => ({ module_code: m.module_code, module_title: m.module_title, progression_stage: m.progression_stage }))}
      />
    </div>
  );
}
