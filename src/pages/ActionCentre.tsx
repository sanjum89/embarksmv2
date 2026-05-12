import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check, X, Undo2, Sparkles, MessageSquareReply, AlertTriangle,
  Hand, ClipboardCheck, Inbox, Wand2, Calendar, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/layout/BackButton";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { getAllDemoOverlays, COHORT_MODULES_FALLBACK, type ActionItem } from "@/data/managerDemoOverlay";
import { useManagerActions } from "@/store/useManagerActions";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";
import { RaisedHandDrawer } from "@/components/manager-hub/RaisedHandDrawer";
import { AIExplainPopover } from "@/components/manager-hub/AIExplainPopover";
import { Schedule1on1Dialog } from "@/components/team-home/Schedule1on1Dialog";
import { SendCheckInDialog } from "@/components/team-home/SendCheckInDialog";

const GROUP_META: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  raised_hand:            { label: "Raised hands",              icon: Hand,           tone: "text-rose-600" },
  reflection_review:      { label: "Reflection reviews",        icon: MessageSquareReply, tone: "text-blue-600" },
  evidence_approval:      { label: "Evidence approvals",        icon: ClipboardCheck, tone: "text-emerald-600" },
  skip_approval:          { label: "Skipped-module approvals", icon: ClipboardCheck, tone: "text-emerald-600" },
  microlearning_approval: { label: "Microlearning approvals",  icon: Wand2,          tone: "text-violet-600" },
  retake_request:         { label: "Retake / extension requests", icon: Calendar,    tone: "text-amber-600" },
  ai_recommendation:      { label: "AI recommendations",        icon: Sparkles,       tone: "text-primary" },
};

const severityRank = { high: 0, medium: 1, low: 2 } as const;

const sevCard = (s: string) =>
  s === "high"
    ? "border-l-rose-500"
    : s === "medium"
    ? "border-l-amber-500"
    : "border-l-muted";

const sevBadge = (s: string) =>
  s === "high"
    ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
    : s === "medium"
    ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
    : "bg-muted text-muted-foreground";

type FilterKey = "all" | "high" | "awaiting";

export default function ActionCentre() {
  const overlays = getAllDemoOverlays();
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const employeesById = normalizedAccount?.employeesById ?? {};
  const nameOf = (id: string) => employeesById[id]?.name || id;
  const titleOf = (id: string) => employeesById[id]?.title || "Learner";
  const { approvals, recordDecision, clearDecision } = useManagerActions();
  const [openId, setOpenId] = useState<string | null>(null);
  const [handAction, setHandAction] = useState<ActionItem | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const selected = overlays.find((o) => o.employeeId === openId) ?? null;

  const allActions = useMemo(
    () => overlays.flatMap((o) => o.actions.map((a) => ({ ...a, learnerName: nameOf(o.employeeId) }))),
    [overlays, employeesById]
  );

  const allChanges = useMemo(
    () => overlays.flatMap((o) => o.pathChanges.map((c) => ({ ...c, learnerName: nameOf(o.employeeId) }))),
    [overlays, employeesById]
  );

  // KPIs
  const kpiHigh = allActions.filter((a) => a.severity === "high" && !approvals[a.id]?.decision).length;
  const kpiHands = allActions.filter((a) => a.group === "raised_hand" && approvals[a.id]?.decision !== "resolved").length;
  const kpiApprovals = allActions.filter(
    (a) => a.group !== "raised_hand" && a.group !== "ai_recommendation" && !approvals[a.id]?.decision
  ).length;
  const kpiAdaptations = allChanges.length;

  // Filter pipeline
  const visibleActions = useMemo(() => {
    let list = allActions.filter((a) => approvals[a.id]?.decision !== "resolved" && approvals[a.id]?.decision !== "approved" && approvals[a.id]?.decision !== "rejected");
    if (filter === "high") list = list.filter((a) => a.severity === "high");
    if (filter === "awaiting") list = list.filter((a) => !approvals[a.id]?.decision);
    return list.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  }, [allActions, approvals, filter]);

  // Top 2 most pressing
  const pressing = visibleActions.filter((a) => a.severity === "high").slice(0, 2);
  const pressingIds = new Set(pressing.map((p) => p.id));
  const remaining = visibleActions.filter((a) => !pressingIds.has(a.id));

  const grouped = useMemo(() => {
    const m = new Map<string, typeof remaining>();
    for (const a of remaining) {
      if (!m.has(a.group)) m.set(a.group, []);
      m.get(a.group)!.push(a);
    }
    return Array.from(m.entries());
  }, [remaining]);

  const handleApprove = (id: string) => { recordDecision(id, "approved", user.name); toast.success("Approved"); };
  const handleReject = (id: string) => { recordDecision(id, "rejected", user.name); toast.success("Rejected"); };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header band */}
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="px-6 pt-4 pb-6">
          <BackButton />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">Action Centre</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                What needs you today — sorted by urgency, with AI's reasoning a click away.
              </p>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
            <KpiTile
              label="Pressing now"
              value={kpiHigh}
              icon={AlertTriangle}
              hero
              hint={kpiHigh === 0 ? "All clear" : "High severity, unresolved"}
            />
            <KpiTile label="Raised hands" value={kpiHands} icon={Hand} hint="Awaiting your reply" />
            <KpiTile label="Pending approvals" value={kpiApprovals} icon={ClipboardCheck} hint="Skips, microlearnings, evidence" />
            <KpiTile label="AI path changes" value={kpiAdaptations} icon={Sparkles} hint="In the last 14 days" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-3.5 w-3.5" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="ai-history" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" /> AI Path Changes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-6">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "high", "awaiting"] as FilterKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filter === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {k === "all" ? "All open" : k === "high" ? "High severity" : "Awaiting you"}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {visibleActions.length} open · sorted by urgency
              </span>
            </div>

            {/* Most pressing */}
            {pressing.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Most pressing</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {pressing.map((a) => (
                    <Card
                      key={a.id}
                      className="relative overflow-hidden border-l-4 border-l-rose-500 p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${sevBadge(a.severity)}`}>HIGH</Badge>
                          <Badge variant="outline" className="text-[10px]">{GROUP_META[a.group]?.label ?? a.group}</Badge>
                          <span className="ml-auto text-xs text-muted-foreground">{a.age}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenId(a.employeeId)}
                          className="mt-2 block text-base font-semibold text-foreground hover:underline"
                        >
                          {a.learnerName}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">· {titleOf(a.employeeId)}</span>
                        </button>
                        <p className="mt-2 text-sm font-medium text-foreground">{a.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {a.group === "raised_hand" ? (
                            <Button size="sm" onClick={() => setHandAction(a)}>
                              <MessageSquareReply className="mr-1.5 h-3.5 w-3.5" /> Reply now
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" onClick={() => handleApprove(a.id)}>
                                <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(a.id)}>
                                <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setOpenId(a.employeeId)}>
                            Open profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Grouped sections */}
            {grouped.map(([group, items]) => {
              const meta = GROUP_META[group];
              const Icon = meta?.icon ?? Inbox;
              return (
                <section key={group}>
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${meta?.tone ?? "text-muted-foreground"}`} />
                    <h3 className="text-sm font-semibold text-foreground">{meta?.label ?? group}</h3>
                    <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((a) => {
                      const decision = approvals[a.id]?.decision;
                      return (
                        <Card key={a.id} className={`border-l-4 ${sevCard(a.severity)} p-3 hover:shadow-sm transition-shadow`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] uppercase ${sevBadge(a.severity)}`}>
                                  {a.severity}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => setOpenId(a.employeeId)}
                                  className="text-sm font-semibold text-foreground hover:underline"
                                >
                                  {a.learnerName}
                                </button>
                                <span className="text-xs text-muted-foreground">· {a.age}</span>
                                {decision && <Badge variant="outline" className="text-[10px] capitalize">{decision}</Badge>}
                              </div>
                              <p className="mt-1 text-sm text-foreground">{a.title}</p>
                              <p className="text-xs text-muted-foreground">{a.detail}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {a.group === "raised_hand" ? (
                                <>
                                  <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setHandAction(a)} disabled={decision === "resolved"}>
                                    <MessageSquareReply className="mr-1 h-3 w-3" />
                                    {decision === "resolved" ? "Resolved" : "Reply"}
                                  </Button>
                                  {decision === "resolved" && (
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { clearDecision(a.id); toast.success("Reopened"); }}>
                                      Reopen
                                    </Button>
                                  )}
                                </>
                              ) : !decision ? (
                                <>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleApprove(a.id)}>
                                    <Check className="mr-1 h-3 w-3" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleReject(a.id)}>
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
                </section>
              );
            })}

            {visibleActions.length === 0 && (
              <Card className="p-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-foreground">Inbox zero</p>
                <p className="text-xs text-muted-foreground">Nothing needs your attention right now. ✨</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ai-history" className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Adaptive path changes the AI has applied for your team
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Each entry is auditable — open the explanation to see signals, evidence and safeguards. Low-risk changes can be reverted.
              </p>
            </div>
            {allChanges.map((c) => {
              const decision = approvals[c.id]?.decision;
              return (
                <Card key={c.id} className="p-3 hover:shadow-sm transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] capitalize bg-primary/5 text-primary border-primary/30">
                          {c.kind.replace(/_/g, " ")}
                        </Badge>
                        <button onClick={() => setOpenId(c.employeeId)} className="text-sm font-semibold text-foreground hover:underline">
                          {c.learnerName}
                        </button>
                        <span className="text-xs text-muted-foreground">· {c.module_title}</span>
                        {decision && <Badge variant="outline" className="text-[10px] capitalize">{decision}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.reason}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <AIExplainPopover
                        align="end"
                        payload={{
                          recommendation: `${c.kind.replace(/_/g, " ")} — ${c.module_title}`,
                          reason: c.reason,
                          evidence: c.evidence,
                          confidence: c.confidence,
                          risk: c.risk,
                          kind: c.kind,
                          decision_rule: c.decision_rule,
                          signals: c.signals,
                          outcome: c.outcome,
                          safeguards: c.safeguards,
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
      </div>

      <LearnerDrawer
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
        learner={selected ? { employeeId: selected.employeeId, name: nameOf(selected.employeeId), title: titleOf(selected.employeeId) } : null}
        overlay={selected}
        modules={COHORT_MODULES_FALLBACK.map((m) => ({ module_code: m.module_code, module_title: m.module_title, progression_stage: m.progression_stage }))}
      />

      <RaisedHandDrawer
        open={!!handAction}
        onOpenChange={(o) => !o && setHandAction(null)}
        action={handAction}
        learner={handAction ? { employeeId: handAction.employeeId, name: nameOf(handAction.employeeId), title: titleOf(handAction.employeeId) } : null}
        onScheduleOneOnOne={(id) => setScheduleId(id)}
        onSendCheckIn={(id) => setCheckInId(id)}
      />

      <Schedule1on1Dialog open={!!scheduleId} onOpenChange={(o) => !o && setScheduleId(null)} defaultLearnerId={scheduleId} />
      <SendCheckInDialog open={!!checkInId} onOpenChange={(o) => !o && setCheckInId(null)} defaultLearnerId={checkInId} />
    </div>
  );
}

function KpiTile({
  label, value, icon: Icon, hint, hero,
}: { label: string; value: number; icon: React.ElementType; hint?: string; hero?: boolean }) {
  if (hero) {
    return (
      <Card className="relative overflow-hidden bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {hint && <p className="mt-1 text-[11px] text-primary-foreground/70">{hint}</p>}
          </div>
          <div className="rounded-lg bg-accent/20 p-2">
            <Icon className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="p-4 border-l-4 border-l-accent/60 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
