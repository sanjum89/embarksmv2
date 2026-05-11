import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Undo2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/layout/BackButton";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { getAllDemoOverlays, COHORT_MODULES_FALLBACK } from "@/data/managerDemoOverlay";
import { useManagerActions } from "@/store/useManagerActions";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";
import { AIExplainPopover } from "@/components/manager-hub/AIExplainPopover";

const GROUP_LABEL: Record<string, string> = {
  raised_hand: "Raised hands",
  reflection_review: "Reflection reviews",
  evidence_approval: "Evidence approvals",
  skip_approval: "Skipped-module approvals",
  microlearning_approval: "Microlearning approvals",
  retake_request: "Retake / extension requests",
  ai_recommendation: "AI recommendations",
};

export default function ActionCentre() {
  const overlays = getAllDemoOverlays();
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const employeesById = normalizedAccount?.employeesById ?? {};
  const nameOf = (id: string) => employeesById[id]?.name || id;
  const titleOf = (id: string) => employeesById[id]?.title || "Learner";
  const { approvals, recordDecision, clearDecision } = useManagerActions();
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = overlays.find((o) => o.employeeId === openId) ?? null;

  const allActions = useMemo(
    () => overlays.flatMap((o) => o.actions.map((a) => ({ ...a, learnerName: nameOf(o.employeeId) }))),
    [overlays, employeesById]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, typeof allActions>();
    for (const a of allActions) {
      if (!m.has(a.group)) m.set(a.group, []);
      m.get(a.group)!.push(a);
    }
    return Array.from(m.entries());
  }, [allActions]);

  const allChanges = useMemo(
    () => overlays.flatMap((o) => o.pathChanges.map((c) => ({ ...c, learnerName: nameOf(o.employeeId) }))),
    [overlays, employeesById]
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <BackButton />
      <div className="mb-6 mt-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Action Centre</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approvals, raised hands, AI recommendations and history.</p>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="ai-history">AI History</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-5">
          {grouped.map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{GROUP_LABEL[group] ?? group}</p>
              <div className="space-y-2">
                {items.map((a) => {
                  const decision = approvals[a.id]?.decision;
                  return (
                    <Card key={a.id} className="p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
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
                            <button
                              type="button"
                              onClick={() => setOpenId(a.employeeId)}
                              className="text-sm font-medium text-foreground hover:underline"
                            >
                              {a.learnerName}
                            </button>
                            <span className="text-xs text-muted-foreground">· {a.age}</span>
                            {decision && <Badge variant="outline" className="text-[10px] capitalize">{decision}</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-foreground">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.detail}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!decision ? (
                            <>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { recordDecision(a.id, "approved", user.name); toast.success("Approved"); }}>
                                <Check className="mr-1 h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { recordDecision(a.id, "rejected", user.name); toast.success("Rejected"); }}>
                                <X className="mr-1 h-3 w-3" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { clearDecision(a.id); toast.success("Cleared"); }}>
                              Undo
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpenId(a.employeeId)}>
                            Open
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {grouped.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">Inbox zero. ✨</Card>}
        </TabsContent>

        <TabsContent value="ai-history" className="space-y-2">
          {allChanges.map((c) => {
            const decision = approvals[c.id]?.decision;
            return (
              <Card key={c.id} className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{c.kind.replace(/_/g, " ")}</Badge>
                      <button onClick={() => setOpenId(c.employeeId)} className="text-sm font-medium text-foreground hover:underline">
                        {c.learnerName}
                      </button>
                      <span className="text-xs text-muted-foreground">· {c.module_title}</span>
                      {decision && <Badge variant="outline" className="text-[10px] capitalize">{decision}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.reason}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <AIExplainPopover
                      align="end"
                      payload={{
                        recommendation: `${c.kind.replace(/_/g, " ")} — ${c.module_title}`,
                        reason: c.reason,
                        evidence: c.evidence,
                        confidence: c.confidence,
                        risk: c.risk,
                      }}
                    >
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Sparkles className="mr-1 h-3 w-3" /> Explain
                      </Button>
                    </AIExplainPopover>
                    {c.risk !== "high" && !decision && (
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { recordDecision(c.id, "reverted", user.name); toast.success("Reverted"); }}>
                        <Undo2 className="mr-1 h-3 w-3" /> Revert
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <LearnerDrawer
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
        learner={selected ? { employeeId: selected.employeeId, name: nameOf(selected.employeeId), title: titleOf(selected.employeeId) } : null}
        overlay={selected}
        modules={COHORT_MODULES_FALLBACK.map((m) => ({ module_code: m.module_code, module_title: m.module_title, progression_stage: m.progression_stage }))}
      />
    </div>
  );
}
