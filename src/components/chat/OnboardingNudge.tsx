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
  const { stage, assessmentCompleted, hasBridgeTarget, bridgeCompleted, isSophie, setShowInlineAssessment } = useAgentOne();
  const { user } = useUser();

  const introTarget = skillTargets.find(st => st.id === "RAT-ST-INTRO-001" && st.assignedTo?.includes(user.id));
  const bridgeTarget = skillTargets.find(st => st.id === "RAT-ST-BRIDGE-001" && st.assignedTo?.includes(user.id));
  const mainTarget = skillTargets.find(st => st.id === "RAT-ST-001" && st.assignedTo?.includes(user.id));

  const getProgress = (t: typeof introTarget) => {
    if (!t) return { progress: 0, completed: 0, total: 0 };
    const completed = t.steps.filter(s => s.status === "completed" || s.status === "skipped").length;
    return { progress: t.steps.length ? Math.round((completed / t.steps.length) * 100) : 0, completed, total: t.steps.length };
  };

  // Intro not complete
  if (introTarget) {
    const introDone = introTarget.progress >= 100 || introTarget.steps.every(s => s.status === "completed" || s.status === "skipped");
    if (!introDone) {
      const p = getProgress(introTarget);
      return {
        type: "intro",
        targetId: introTarget.id,
        title: introTarget.title,
        progress: p.progress,
        completedSteps: p.completed,
        totalSteps: p.total,
        ctaPath: `/skill-target/${introTarget.id}`,
        ctaLabel: p.completed > 0 ? "Continue" : "Start",
      };
    }
  }

  // Bridge needed
  if (hasBridgeTarget && bridgeTarget && !bridgeCompleted) {
    const p = getProgress(bridgeTarget);
    return {
      type: "bridge",
      targetId: bridgeTarget.id,
      title: bridgeTarget.title,
      progress: p.progress,
      completedSteps: p.completed,
      totalSteps: p.total,
      ctaPath: `/skill-target/${bridgeTarget.id}`,
      ctaLabel: p.completed > 0 ? "Continue" : "Start",
    };
  }

  // Assessment needed (not Sophie, not completed)
  if (!isSophie && !assessmentCompleted && (stage === "pre-assessment" || stage === "task-list")) {
    return {
      type: "assessment",
      targetId: "assessment",
      title: "Skills Assessment",
      progress: 0,
      completedSteps: 0,
      totalSteps: 1,
      ctaPath: "",
      ctaLabel: "Take Assessment",
    };
  }

  // Main target in progress
  if (mainTarget && !mainTarget.locked) {
    const mainDone = mainTarget.progress >= 100 || mainTarget.steps.every(s => s.status === "completed" || s.status === "skipped");
    if (!mainDone) {
      const p = getProgress(mainTarget);
      return {
        type: "main",
        targetId: mainTarget.id,
        title: mainTarget.title,
        progress: p.progress,
        completedSteps: p.completed,
        totalSteps: p.total,
        ctaPath: `/skill-target/${mainTarget.id}`,
        ctaLabel: p.completed > 0 ? "Continue" : "Start",
      };
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="shrink-0 px-4 pt-1"
      >
        <button
          onClick={() => setDismissed(false)}
          className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
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
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="shrink-0 mx-4 mt-1"
      >
        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5 relative">
          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            title="Minimize"
          >
            <ChevronUp className="h-3 w-3" />
          </button>

          <div className="flex items-center gap-2 pr-5">
            <div className="shrink-0 h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              {isAssessment ? (
                <ClipboardList className="h-3 w-3 text-primary" />
              ) : (
                <BookOpen className="h-3 w-3 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate">{nudge.title}</p>
              {showProgress ? (
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={nudge.progress} className="h-1 flex-1" />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {nudge.completedSteps}/{nudge.totalSteps}
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isAssessment
                    ? "Helps customise your learning path"
                    : "Up next in your onboarding"}
                </p>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-2">
            {isAssessment ? (
              <button
                onClick={() => setShowInlineAssessment(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all"
              >
                <ClipboardList className="h-3 w-3" />
                {nudge.ctaLabel}
              </button>
            ) : (
              <Link
                to={nudge.ctaPath}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all"
              >
                {nudge.ctaLabel}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
