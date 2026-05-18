import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarPlus,
  Sparkles,
  MessageSquarePlus,
  StickyNote,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { LearnerStatusBadge } from "./LearnerStatusBadge";
import { TeamAvatar } from "@/components/team-home/Avatar";
import { AIExplainPopover } from "./AIExplainPopover";
import { useManagerActions } from "@/store/useManagerActions";
import { COHORT_MODULES_FALLBACK, type LearnerOverlay, type LearnerStatus } from "@/data/managerDemoOverlay";
import type { CohortModuleCol } from "@/hooks/useManagerCohortData";
import { cn } from "@/lib/utils";

const STATUS_EYEBROW: Record<LearnerStatus, string> = {
  at_risk: "Why they're at risk",
  needs_check_in: "Why they need a check-in",
  rising_star: "Why they're a rising star",
  on_track: "Why they're on track",
};

const STATUS_ACCENT: Record<LearnerStatus, string> = {
  at_risk: "bg-rose-500",
  needs_check_in: "bg-amber-500",
  rising_star: "bg-emerald-500",
  on_track: "bg-sky-500",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: { employeeId: string; name: string; title?: string } | null;
  overlay: LearnerOverlay | null;
  modules: CohortModuleCol[];
  initialTab?: string;
}

const ADAPT_LABEL: Record<string, string> = {
  diagnostic_only: "Diagnostic",
  microlearning: "Microlearning",
  skip_after_validation: "Skipped",
  emphasis: "Emphasis",
};

export function LearnerDrawer({ open, onOpenChange, learner, overlay, modules, initialTab = "story" }: Props) {
  const { user } = useUser();
  const { notes, addNote, removeNote, assign } = useManagerActions();
  const [noteDraft, setNoteDraft] = useState("");

  const learnerNotes = useMemo(
    () => (learner ? notes.filter((n) => n.employeeId === learner.employeeId) : []),
    [notes, learner]
  );

  if (!learner) return null;

  const handleAddNote = () => {
    const body = noteDraft.trim();
    if (!body) return;
    addNote({ employeeId: learner.employeeId, body, author: user.name });
    setNoteDraft("");
    toast.success("Note added");
  };

  const quickAction = (kind: "1on1" | "microlearning" | "reflection_request", title: string, msg: string) => {
    assign({ employeeId: learner.employeeId, kind, title });
    toast.success(msg);
  };

  const completed = overlay?.cells.filter((c) => c.status === "completed").length ?? 0;
  const total = overlay?.cells.length ?? 0;
  const progressPct = total ? Math.round((completed / total) * 100) : 0;
  const failedAttempts = overlay?.cells.filter((c) => c.score != null && (c.score as number) < 70).length ?? 0;
  const status = overlay?.status;
  const eyebrow = status ? STATUS_EYEBROW[status] : "Profile summary";
  const accent = status ? STATUS_ACCENT[status] : "bg-muted-foreground";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[720px] p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-5">
          <div className={cn("absolute inset-x-0 top-0 h-0.5", accent)} />
          <div className="flex items-start gap-4">
            <TeamAvatar name={learner.name} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="font-display text-2xl leading-tight">{learner.name}</SheetTitle>
                <LearnerStatusBadge status={status} className="text-xs px-2.5 py-0.5" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {learner.title ?? "Associate Investment Manager"}
                {overlay?.cpd ? <> · CPD {overlay.cpd.hours_logged}/{overlay.cpd.hours_required}h</> : null}
              </p>
            </div>
          </div>

          {overlay?.story && (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{overlay.story}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatChip label="Progress" value={`${progressPct}% · ${completed}/${total}`} />
                {failedAttempts > 0 && (
                  <StatChip label="Failed attempts" value={`${failedAttempts}`} tone="rose" />
                )}
                {overlay?.cpd && (
                  <StatChip label="CPD" value={`${overlay.cpd.hours_logged}/${overlay.cpd.hours_required}h`} />
                )}
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="story">Story</TabsTrigger>
              <TabsTrigger value="path">Path</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="role-plays">Role Plays</TabsTrigger>
              <TabsTrigger value="reflections">Reflections</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="space-y-4">
              <p className="text-sm text-foreground/90">{overlay?.story ?? "No deeper story available yet."}</p>
              <Separator />
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Timeline</p>
                <ol className="space-y-2">
                  {(overlay?.timeline ?? []).map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{new Date(t.date).toLocaleDateString()}</span>
                      <span className="text-foreground">{t.label}</span>
                    </li>
                  ))}
                  {(!overlay || overlay.timeline.length === 0) && (
                    <li className="text-sm text-muted-foreground">No events recorded.</li>
                  )}
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="path" className="space-y-2">
              {modules.map((m, i) => {
                const cell = overlay?.cells[i];
                const change = overlay?.pathChanges.find((c) => c.module_code === m.module_code);
                return (
                  <div key={m.module_code} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.module_title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.progression_stage ?? "core"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cell?.adaptation && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {ADAPT_LABEL[cell.adaptation] ?? cell.adaptation}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] font-normal",
                            cell?.status === "completed" && "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
                            cell?.status === "in_progress" && "bg-sky-500/10 text-sky-700 border-sky-500/30",
                            cell?.status === "locked" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {cell?.status ?? "not_started"}
                        </Badge>
                      </div>
                    </div>
                    {change && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded bg-muted/40 px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">AI:</span> {change.reason}
                        </p>
                        <AIExplainPopover
                          payload={{
                            recommendation: `${change.kind.replace(/_/g, " ")} — ${change.module_title}`,
                            reason: change.reason,
                            evidence: change.evidence,
                            confidence: change.confidence,
                            risk: change.risk,
                            kind: change.kind,
                            decision_rule: change.decision_rule,
                            signals: change.signals,
                            outcome: change.outcome,
                            safeguards: change.safeguards,
                            deepResearchPrompt: `Tell me more about why ${learner.name}'s ${change.module_title} was ${change.kind}.`,
                          }}
                        >
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <Sparkles className="mr-1 h-3 w-3" /> Explain
                          </Button>
                        </AIExplainPopover>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="assessments" className="space-y-2">
              {overlay && overlay.cells.some((c) => c.score != null) ? (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 text-left">Module</th>
                      <th className="py-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overlay.cells
                      .filter((c) => c.score != null)
                      .map((c) => {
                        const title =
                          modules.find((mm) => mm.module_code === c.module_code)?.module_title
                          ?? COHORT_MODULES_FALLBACK.find((mm) => mm.module_code === c.module_code)?.module_title
                          ?? c.module_code
                              .replace(/^mod\.[^.]+\./, "")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (ch) => ch.toUpperCase());
                        return (
                          <tr key={c.module_code} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{title}</td>
                            <td className="py-2 text-right font-medium">{c.score}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">No assessments recorded.</p>
              )}
            </TabsContent>

            <TabsContent value="role-plays" className="space-y-2">
              {overlay?.rolePlays.length ? (
                overlay.rolePlays.map((rp) => (
                  <div key={rp.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{rp.title}</p>
                      <Badge variant="outline" className="text-[11px]">{rp.score}%</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rp.behaviours.map((b) => (
                        <Badge key={b} variant="outline" className="text-[10px] font-normal">{b}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No role plays attempted yet.</p>
              )}
            </TabsContent>

            <TabsContent value="reflections" className="space-y-2">
              {overlay?.reflections.length ? (
                overlay.reflections.map((r) => (
                  <div key={r.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{r.topic}</p>
                      <Badge variant="outline" className="text-[11px] capitalize">{r.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reflections submitted yet.</p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-3">
              <div className="rounded-md border border-border p-3">
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={`Add a note about ${learner.name}…`}
                  rows={3}
                  className="resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={handleAddNote} disabled={!noteDraft.trim()}>
                    <StickyNote className="mr-1 h-3 w-3" /> Save note
                  </Button>
                </div>
              </div>
              {learnerNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {learnerNotes.map((n) => (
                <div key={n.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{n.body}</p>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeNote(n.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.author} · {new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t bg-muted/30 px-6 py-3 flex flex-wrap gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => quickAction("1on1", `1:1 with ${learner.name}`, "1:1 scheduled (demo)")}>
            <CalendarPlus className="mr-1 h-3 w-3" /> Schedule 1:1
          </Button>
          <Button size="sm" variant="outline" onClick={() => quickAction("microlearning", `Microlearning for ${learner.name}`, "Microlearning assigned")}>
            <Sparkles className="mr-1 h-3 w-3" /> Assign microlearning
          </Button>
          <Button size="sm" variant="outline" onClick={() => quickAction("reflection_request", `Reflection request — ${learner.name}`, "Reflection request sent")}>
            <MessageSquarePlus className="mr-1 h-3 w-3" /> Request reflection
          </Button>
          <Button size="sm" onClick={() => { toast.success(`${learner.name} marked ready`); }}>
            <CheckCircle2 className="mr-1 h-3 w-3" /> Approve readiness
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
