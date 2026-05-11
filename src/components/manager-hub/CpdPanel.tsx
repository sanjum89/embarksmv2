import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { CohortLearner } from "@/hooks/useManagerCohortData";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  on_track: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  at_risk: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  overdue: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

export function CpdPanel({ learners, onOpenLearner }: { learners: CohortLearner[]; onOpenLearner: (id: string) => void }) {
  const rows = learners
    .map((l) => ({ learner: l, cpd: l.overlay?.cpd }))
    .filter((r) => r.cpd);

  if (rows.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">No CPD data tracked for this cohort yet.</Card>;
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">CPD / CISI Progress</p>
          <p className="text-xs text-muted-foreground">35 hours required per regulated learner per cycle.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast.success("Audit-ready report queued (demo)")}>
          <Download className="mr-1 h-3 w-3" /> Export audit
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">Learner</th>
            <th className="px-4 py-2 text-left">Hours</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ learner, cpd }) => {
            const pct = Math.min(100, Math.round((cpd!.hours_logged / cpd!.hours_required) * 100));
            return (
              <tr key={learner.employeeId} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-2">
                  <button onClick={() => onOpenLearner(learner.employeeId)} className="text-foreground hover:underline">
                    {learner.name}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full",
                          cpd!.status === "on_track" ? "bg-emerald-500" : cpd!.status === "at_risk" ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{cpd!.hours_logged}/{cpd!.hours_required}h</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Badge variant="outline" className={cn("text-[11px] capitalize", STATUS_TONE[cpd!.status])}>
                    {cpd!.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{cpd!.evidence_count} items</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
