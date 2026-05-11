import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Undo2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiPathChange } from "@/data/managerDemoOverlay";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  change: AiPathChange;
  learnerName: string;
  decision?: "approved" | "reverted";
  onDecide: (kind: "approved" | "reverted") => void;
  onOpenLearner?: () => void;
}

const KIND_LABEL: Record<AiPathChange["kind"], string> = {
  skipped: "Skipped",
  microlearning: "Microlearning",
  diagnostic_only: "Diagnostic only",
  emphasis: "Emphasised",
  reordered: "Reordered",
};

const KIND_DESC: Record<AiPathChange["kind"], string> = {
  skipped: "Module removed from this learner's path.",
  microlearning: "Replaced with a shorter, focused micro-module.",
  diagnostic_only: "Reduced to a diagnostic check, full module unlocks if needed.",
  emphasis: "Extra time and reinforcement added to this module.",
  reordered: "Sequence position changed for this learner.",
};

export function AdaptivePathDrawer({ open, onOpenChange, change, learnerName, decision, onDecide, onOpenLearner }: Props) {
  const riskTone =
    change.risk === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
    change.risk === "medium" ? "bg-warning/10 text-warning border-warning/20" :
    "bg-success/10 text-success border-success/20";
  const confTone =
    change.confidence === "high" ? "bg-success/10 text-success border-success/20" :
    change.confidence === "medium" ? "bg-warning/10 text-warning border-warning/20" :
    "bg-muted text-muted-foreground border-border";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SheetTitle className="text-base">Adaptive change</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            {learnerName} · {change.module_title}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Why */}
          <section className="rounded-xl border border-border bg-background p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Why the AI changed it</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{change.reason}</p>
            {change.evidence?.length > 0 && (
              <ul className="mt-3 space-y-1">
                {change.evidence.map((e, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-muted-foreground/40">•</span> {e}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="outline" className={cn("text-[10px] capitalize", confTone)}>{change.confidence} confidence</Badge>
              <Badge variant="outline" className={cn("text-[10px] capitalize", riskTone)}>{change.risk} risk</Badge>
              {change.needs_approval && !decision && (
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">Needs approval</Badge>
              )}
              {decision && (
                <Badge variant="outline" className="text-[10px] capitalize">{decision}</Badge>
              )}
            </div>
          </section>

          {/* What changed */}
          <section className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-sm font-medium text-foreground">What changed</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-muted-foreground line-through">
                {change.module_title}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-medium text-primary">
                {KIND_LABEL[change.kind]}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{KIND_DESC[change.kind]}</p>
          </section>

          {/* Actions */}
          <section className="flex flex-col gap-2">
            {change.needs_approval && !decision && (
              <Button onClick={() => onDecide("approved")}>
                <Check className="h-4 w-4 mr-1.5" /> Approve change
              </Button>
            )}
            {decision !== "reverted" && (
              <Button variant="outline" onClick={() => onDecide("reverted")}>
                <Undo2 className="h-4 w-4 mr-1.5" /> Revert to default path
              </Button>
            )}
            {onOpenLearner && (
              <Button variant="ghost" onClick={onOpenLearner} className="text-xs">
                View full learner story →
              </Button>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
