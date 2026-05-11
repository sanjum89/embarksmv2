import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import BackButton from "@/components/layout/BackButton";
import { useManagerCohortData } from "@/hooks/useManagerCohortData";
import { RosterHeatmap } from "@/components/manager-hub/RosterHeatmap";
import { AIChangesFeed } from "@/components/manager-hub/AIChangesFeed";
import { CpdPanel } from "@/components/manager-hub/CpdPanel";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";

export default function ManagerCohortHub() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { loading, cohort, learners, modules } = useManagerCohortData(cohortId ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLearner, setDrawerLearner] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState("story");

  const selected = useMemo(
    () => learners.find((l) => l.employeeId === drawerLearner) ?? null,
    [learners, drawerLearner]
  );

  const summary = useMemo(() => {
    const total = learners.length;
    const atRisk = learners.filter((l) => l.overlay?.status === "at_risk" || l.overlay?.status === "needs_check_in").length;
    const adapted = learners.reduce((acc, l) => acc + (l.overlay?.cells.filter((c) => c.adaptation).length ?? 0), 0);
    const pending = learners.reduce((acc, l) => acc + (l.overlay?.pathChanges.filter((c) => c.needs_approval).length ?? 0), 0);
    const completedCells = learners.reduce((acc, l) => acc + (l.overlay?.cells.filter((c) => c.status === "completed").length ?? 0), 0);
    const totalCells = total * Math.max(modules.length, 1);
    const pct = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;
    return { total, atRisk, adapted, pending, pct };
  }, [learners, modules.length]);

  const openLearner = (employeeId: string, _moduleCode?: string, tab: string = "story") => {
    setDrawerLearner(employeeId);
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <BackButton />
        <p className="mt-6 text-sm text-muted-foreground">Loading cohort…</p>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="flex-1 p-6">
        <BackButton />
        <p className="mt-6 text-sm text-muted-foreground">Cohort not found.</p>
      </div>
    );
  }

  const aiSummary = `${summary.total - summary.atRisk} of ${summary.total} learners on track${
    summary.adapted > 0 ? `; ${summary.adapted} AI adaptations active` : ""
  }${summary.pending > 0 ? `; ${summary.pending} awaiting your approval` : ""}.`;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <BackButton />

      {/* Top bar */}
      <div className="mb-6 mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{cohort.cohort_title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{cohort.cohort_code}</span>
              <Badge variant="outline" className="text-[11px]">{cohort.role_cohort_code}</Badge>
              {cohort.start_date && <span>· Start {new Date(cohort.start_date).toLocaleDateString()}</span>}
              {cohort.due_date && <span>· Due {new Date(cohort.due_date).toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">{summary.pct}% complete</Badge>
            {summary.atRisk > 0 ? (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
                Needs attention · {summary.atRisk}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                On track
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/90">{aiSummary}</p>
        </div>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="ai-changes">
            AI Changes
            {summary.pending > 0 && (
              <Badge variant="outline" className="ml-2 h-4 px-1 text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                {summary.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cpd">CPD / CISI</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <RosterHeatmap learners={learners} modules={modules} onSelectLearner={(id, mc) => openLearner(id, mc, mc ? "path" : "story")} />
        </TabsContent>

        <TabsContent value="ai-changes">
          <AIChangesFeed learners={learners} onOpenLearner={(id) => openLearner(id, undefined, "path")} />
        </TabsContent>

        <TabsContent value="cpd">
          <CpdPanel learners={learners} onOpenLearner={(id) => openLearner(id)} />
        </TabsContent>
      </Tabs>

      <LearnerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        learner={selected ? { employeeId: selected.employeeId, name: selected.name, title: selected.title } : null}
        overlay={selected?.overlay ?? null}
        modules={modules}
        initialTab={drawerTab}
      />
    </div>
  );
}
