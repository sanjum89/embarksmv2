import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useManagerActions } from "@/store/useManagerActions";
import { AIExplainPopover } from "./AIExplainPopover";
import type { CohortLearner } from "@/hooks/useManagerCohortData";
import { cn } from "@/lib/utils";

interface Props {
  learners: CohortLearner[];
  onOpenLearner: (employeeId: string) => void;
}

const KIND_TONE: Record<string, string> = {
  skipped: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  microlearning: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  diagnostic_only: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  emphasis: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  reordered: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

export function AIChangesFeed({ learners, onOpenLearner }: Props) {
  const { user } = useUser();
  const { approvals, recordDecision, clearDecision } = useManagerActions();
  const employeesById = new Map(learners.map((l) => [l.employeeId, l]));

  const allChanges = learners
    .flatMap((l) => (l.overlay?.pathChanges ?? []).map((c) => ({ ...c, learnerName: l.name })))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (allChanges.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">No AI path changes yet for this cohort.</Card>;
  }

  return (
    <div className="space-y-2">
      {allChanges.map((c) => {
        const decision = approvals[c.id]?.decision;
        return (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[11px] capitalize", KIND_TONE[c.kind])}>
                    {c.kind.replace(/_/g, " ")}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onOpenLearner(c.employeeId)}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {c.learnerName}
                  </button>
                  <span className="text-sm text-muted-foreground">· {c.module_title}</span>
                  {c.needs_approval && !decision && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]">
                      Awaiting approval
                    </Badge>
                  )}
                  {decision && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {decision}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.reason}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1">
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
                    deepResearchPrompt: `Why did AI ${c.kind.replace(/_/g, " ")} ${c.module_title} for ${c.learnerName}? Rule: ${c.decision_rule ?? ""}. Signals: ${(c.signals ?? []).map((s) => `${s.label}=${s.value}`).join("; ")}.`,
                  }}
                >
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                    <Sparkles className="mr-1 h-3 w-3" /> Explain
                  </Button>
                </AIExplainPopover>
                {!decision ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        recordDecision(c.id, "approved", user.name);
                        toast.success("Approved");
                      }}
                    >
                      <Check className="mr-1 h-3 w-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        recordDecision(c.id, "rejected", user.name);
                        toast.success("Rejected");
                      }}
                    >
                      <X className="mr-1 h-3 w-3" /> Reject
                    </Button>
                    {c.risk !== "high" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          recordDecision(c.id, "reverted", user.name);
                          toast.success("Reverted to original path");
                        }}
                      >
                        <Undo2 className="mr-1 h-3 w-3" /> Revert
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      clearDecision(c.id);
                      toast.success("Decision cleared");
                    }}
                  >
                    Undo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
