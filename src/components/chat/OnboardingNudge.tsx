import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ArrowRight, ChevronUp, ClipboardList } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAgentOne } from "@/contexts/AgentOneContext";
import { useUser } from "@/contexts/UserContext";

interface NudgeState {
  type: "intro" | "bridge" | "assessment" | "main" | "done";
  targetId: string;
  title: string;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  ctaPath: string;
  ctaLabel: string;
}

function useOnboardingNudge(): NudgeState | null {
  const { skillTargets } = useSkillTargets();
  const { stage, assessmentCompleted, hasBridgeTarget, bridgeCompleted, isSophie } = useAgentOne();
  const { user } = useUser();

  const introTarget = skillTargets.find(st => st.id === "RAT-ST-INTRO-001" && st.assignedTo?.includes(user.id));
  const bridgeTarget = skillTargets.find(st => st.id === "RAT-ST-BRIDGE-001" && st.assignedTo?.includes(user.id));
  const mainTarget = skillTargets.find(st => st.id === "RAT-ST-001" && st.assignedTo?.includes(user.id));

  const getProgress = (t: typeof introTarget) => {
    if (!t) return { progress: 0, completed: 0, total: 0 };
    const completed = t.steps.filter(s => s.status === "completed" || s.status === "skipped").length;
    return { progress: t.steps.length ? Math.round((completed / t.steps.length) * 100) : 0, completed, total: t.steps.length };
  };

  if (introTarget) {
    const introDone = introTarget.progress >= 100 || introTarget.steps.every(s => s.status === "completed" || s.status === "skipped");
    if (!introDone) {
      const p = getProgress(introTarget);
      return { type: "intro", targetId: introTarget.id, title: introTarget.title, progress: p.progress, completedSteps: p.completed, totalSteps: p.total, ctaPath: `/skill-target/${introTarget.id}`, ctaLabel: p.completed > 0 ? "Continue" : "Start" };
    }
  }

  if (hasBridgeTarget && bridgeTarget && !bridgeCompleted) {
    const p = getProgress(bridgeTarget);
    return { type: "bridge", targetId: bridgeTarget.id, title: bridgeTarget.title, progress: p.progress, completedSteps: p.completed, totalSteps: p.total, ctaPath: `/skill-target/${bridgeTarget.id}`, ctaLabel: p.completed > 0 ? "Continue" : "Start" };
  }

  if (!isSophie && !assessmentCompleted && (stage === "pre-assessment" || stage === "task-list")) {
    return { type: "assessment", targetId: "assessment", title: "Skills Assessment", progress: 0, completedSteps: 0, totalSteps: 1, ctaPath: "", ctaLabel: "Take Assessment" };
  }

  if (mainTarget && !mainTarget.locked) {
    const mainDone = mainTarget.progress >= 100 || mainTarget.steps.every(s => s.status === "completed" || s.status === "skipped");
    if (!mainDone) {
      const p = getProgress(mainTarget);
      return { type: "main", targetId: mainTarget.id, title: mainTarget.title, progress: p.progress, completedSteps: p.completed, totalSteps: p.total, ctaPath: `/skill-target/${mainTarget.id}`, ctaLabel: p.completed > 0 ? "Continue" : "Start" };
    }
  }

  return null;
}

export function OnboardingNudge() {
  const nudge = useOnboardingNudge();
  const { setShowInlineAssessment, setIsOpen } = useAgentOne();
  const [dismissed, setDismissed] = useState(false);

  if (!nudge) return null;

  if (dismissed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0 px-3 pt-1">
        <button
          onClick={() => setDismissed(false)}
          className="flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <BookOpen className="h-3 w-3" />
          Onboarding
        </button>
      </motion.div>
    );
  }

  const isAssessment = nudge.type === "assessment";
  const showProgress = nudge.progress > 0 && !isAssessment;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 2 }}
        className="shrink-0 border-t border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/80 dark:bg-emerald-950/30"
      >
        <div className="flex items-center gap-3 px-3 py-2.5 min-h-[40px]">
          {/* Icon */}
          <div className="shrink-0 h-7 w-7 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            {isAssessment ? <ClipboardList className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
          </div>

          {/* Title + progress inline */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-[11px] font-medium text-foreground truncate">
              {nudge.title}
            </span>
            {showProgress && (
              <>
                <Progress value={nudge.progress} className="h-1 w-12 shrink-0" />
                <span className="text-[10px] text-muted-foreground shrink-0">{nudge.completedSteps}/{nudge.totalSteps}</span>
              </>
            )}
            {!showProgress && !isAssessment && (
              <span className="text-[10px] text-muted-foreground shrink-0">Up next</span>
            )}
          </div>

          {/* CTA */}
          {isAssessment ? (
            <button
              onClick={() => setShowInlineAssessment(true)}
              className="shrink-0 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {nudge.ctaLabel}
            </button>
          ) : (
            <Link
              to={nudge.ctaPath}
              onClick={() => setIsOpen(false)}
              className="shrink-0 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {nudge.ctaLabel}
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          )}

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            title="Minimize"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
