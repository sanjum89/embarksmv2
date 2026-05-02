import { motion } from "framer-motion";
import { CheckCircle2, Circle, Lock, SkipForward, Clock } from "lucide-react";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StepStatus } from "@/types/learning";

const statusConfig: Record<StepStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-success", label: "Completed" },
  in_progress: { icon: Clock, color: "text-info", label: "In Progress" },
  available: { icon: Circle, color: "text-accent", label: "Available" },
  locked: { icon: Lock, color: "text-muted-foreground", label: "Locked" },
  skipped: { icon: SkipForward, color: "text-warning", label: "Skipped" },
};

export default function ProgressPanel() {
  const { skillTargets } = useSkillTargets();
  const st4 = skillTargets.find((st) => st.id === "st4");

  if (!st4) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-sm text-muted-foreground">
        No skill target found.
      </div>
    );
  }

  const steps = [...st4.steps].sort((a, b) => a.order - b.order);
  const completed = steps.filter((s) => s.status === "completed").length;
  const skipped = steps.filter((s) => s.status === "skipped").length;

  return (
    <div className="p-6">
      <h3 className="font-display text-lg font-bold text-foreground mb-1">Maya's Progress</h3>
      <p className="text-sm text-muted-foreground mb-4">{st4.title}</p>

      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-background p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Overall Progress</span>
          <span className="text-sm font-bold text-foreground">{st4.progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${st4.progress}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>{completed} completed</span>
          {skipped > 0 && <span>{skipped} skipped</span>}
          <span>{steps.length} total</span>
        </div>
      </div>

      {/* Step timeline */}
      <div className="space-y-0">
        {steps.map((step, i) => {
          const config = statusConfig[step.status];
          const Icon = config.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex gap-3"
            >
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", 
                  step.status === "completed" ? "border-success bg-success/10" :
                  step.status === "skipped" ? "border-warning bg-warning/10" :
                  step.status === "available" || step.status === "in_progress" ? "border-accent bg-accent/10" :
                  "border-border bg-secondary"
                )}>
                  <Icon className={cn("h-3 w-3", config.color)} />
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-0.5 flex-1 min-h-[24px]", 
                    step.status === "completed" || step.status === "skipped" ? "bg-success/30" : "bg-border"
                  )} />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", step.status === "locked" ? "text-muted-foreground" : "text-foreground")}>
                    {step.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[0.6rem]">{step.type}</Badge>
                  <span className={cn("text-[0.65rem]", config.color)}>{config.label}</span>
                  {step.duration && <span className="text-[0.65rem] text-muted-foreground">· {step.duration}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
