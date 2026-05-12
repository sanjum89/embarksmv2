import { Microscope, Check, Loader2 } from "lucide-react";
import type { ThinkingStage } from "@/hooks/useDeepResearch";

const STAGE_LABELS: Record<ThinkingStage, string> = {
  planning: "Planning research approach…",
  retrieving: "Pulling cohort, learner & evidence signals…",
  analysing: "Cross-referencing modules, proficiency & risk…",
  drafting: "Drafting executive summary…",
  finalising: "Composing visuals & recommended actions…",
};

const STAGE_ORDER: ThinkingStage[] = ["planning", "retrieving", "analysing", "drafting", "finalising"];

interface Props {
  stage: ThinkingStage | null;
  trace: ThinkingStage[];
}

export function ThinkingPanel({ stage, trace }: Props) {
  if (!stage) return null;
  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden animate-fade-in">
      {/* Shimmer progress bar */}
      <div className="relative h-0.5 bg-primary/10 overflow-hidden">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-shimmer" />
      </div>

      <div className="p-4 space-y-2.5">
        {/* Completed steps */}
        {trace.map((s) => (
          <div key={s} className="flex items-center gap-2 text-[11px] text-muted-foreground animate-fade-in">
            <Check className="h-3 w-3 text-success shrink-0" />
            <span className="line-through decoration-muted-foreground/30">{STAGE_LABELS[s]}</span>
          </div>
        ))}

        {/* Current stage */}
        <div key={stage} className="flex items-center gap-2.5 animate-fade-in">
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-soft" />
            <Microscope className="h-3.5 w-3.5 text-primary relative" />
          </div>
          <div className="text-xs font-medium text-foreground flex-1">{STAGE_LABELS[stage]}</div>
          <Loader2 className="h-3 w-3 text-primary/70 animate-spin" />
        </div>

        {/* Upcoming hint */}
        {currentIndex < STAGE_ORDER.length - 1 && (
          <div className="text-[10px] text-muted-foreground/60 pl-5">
            next · {STAGE_LABELS[STAGE_ORDER[currentIndex + 1]]}
          </div>
        )}
      </div>
    </div>
  );
}
