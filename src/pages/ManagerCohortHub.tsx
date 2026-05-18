import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plug } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { useManagerCohortData } from "@/hooks/useManagerCohortData";
import { RosterHeatmap } from "@/components/manager-hub/RosterHeatmap";
import { AIChangesFeed } from "@/components/manager-hub/AIChangesFeed";
import { IntegrationsTab } from "@/components/manager-hub/IntegrationsTab";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";
import { AdaptivePathsSankey } from "@/components/team-home/AdaptivePathsSankey";
import { roleCohortLabel } from "@/lib/roleCohortLabel";

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

  const cohortsCrumb = { label: "Cohorts", to: "/manager/cohorts" };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <PageHeader
          title="Cohort"
          breadcrumbs={[cohortsCrumb, { label: "…" }]}
        />
        <PageBody>
          <p className="text-sm text-muted-foreground">Loading cohort…</p>
        </PageBody>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="flex-1 overflow-y-auto">
        <PageHeader
          title="Cohort"
          breadcrumbs={[cohortsCrumb, { label: "Not found" }]}
        />
        <PageBody>
          <p className="text-sm text-muted-foreground">Cohort not found.</p>
        </PageBody>
      </div>
    );
  }

  const aiSummary = `${summary.total - summary.atRisk} of ${summary.total} learners on track${
    summary.adapted > 0 ? `; ${summary.adapted} AI adaptations active` : ""
  }${summary.pending > 0 ? `; ${summary.pending} awaiting your approval` : ""}.`;

  const subtitleNode = (
    <span className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="text-[11px]">{roleCohortLabel(cohort.role_cohort_code)}</Badge>
      {cohort.start_date && <span>Start {new Date(cohort.start_date).toLocaleDateString()}</span>}
      {cohort.due_date && <span>· Due {new Date(cohort.due_date).toLocaleDateString()}</span>}
    </span>
  );

  const headerActions = (
    <>
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
    </>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title={cohort.cohort_title}
        subtitle={subtitleNode}
        breadcrumbs={[cohortsCrumb, { label: cohort.cohort_title }]}
        actions={headerActions}
      />
      <PageBody>
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/90">{aiSummary}</p>
        </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="ai-changes">
            AI Decisions
            {summary.pending > 0 && (
              <Badge variant="outline" className="ml-2 h-4 px-1 text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                {summary.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="adaptive">Adaptive Paths</TabsTrigger>
          <TabsTrigger value="cpd" className="gap-1.5">
            <Plug className="h-3 w-3" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <RosterHeatmap learners={learners} modules={modules} onSelectLearner={(id, mc) => openLearner(id, mc, mc ? "path" : "story")} />
        </TabsContent>

        <TabsContent value="ai-changes">
          <AIChangesFeed learners={learners} onOpenLearner={(id) => openLearner(id, undefined, "path")} />
        </TabsContent>

        <TabsContent value="adaptive">
          <AdaptivePathsSankey
            learners={learners
              .filter((l) => l.overlay)
              .map((l) => ({ employeeId: l.employeeId, name: l.name, overlay: l.overlay! }))}
            modules={modules.map((m) => ({
              module_code: m.module_code,
              module_title: m.module_title,
              progression_stage: m.progression_stage ?? "",
            }))}
            onOpenLearner={(id) => openLearner(id, undefined, "path")}
          />
        </TabsContent>

        <TabsContent value="cpd">
          <IntegrationsTab learners={learners} onOpenLearner={(id) => openLearner(id)} />
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
      </PageBody>
    </div>
  );
}
