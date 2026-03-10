import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Target, ClipboardCheck, Drama } from "lucide-react";
import { mockProgress } from "@/data/aiManagerFlow";

export function ProgressCard() {
  const { assessmentScore, modulesCompleted, modulesTotal, rolePlayDone, skillTargetProgress } =
    mockProgress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm max-w-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Your Progress Summary</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <ClipboardCheck className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{assessmentScore}%</p>
          <p className="text-[10px] text-muted-foreground">Assessment Score</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <Target className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {modulesCompleted}/{modulesTotal}
          </p>
          <p className="text-[10px] text-muted-foreground">Modules Done</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Drama className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-foreground flex-1">Role Play</span>
          {rolePlayDone ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
          ) : (
            <span className="text-[10px] text-muted-foreground">Pending</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-foreground flex-1">Learning Path</span>
          <span className="text-[10px] font-medium text-primary">{skillTargetProgress}%</span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mt-3">
        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${skillTargetProgress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Overall onboarding progress
        </p>
      </div>
    </motion.div>
  );
}
