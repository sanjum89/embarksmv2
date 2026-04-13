import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Eye, BookOpen, Headphones, Wrench, Layers } from "lucide-react";

import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAccount } from "@/contexts/AccountContext";
import { resolveModule } from "@/lib/learnPathModuleResolver";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { EmbarkModuleContent } from "@/components/learnpath/LearnPathModuleContent";
import type { LearningMode } from "@/contexts/LearnPathContext";
import { cn } from "@/lib/utils";

const modeOptions: { value: LearningMode; icon: React.ElementType; label: string }[] = [
  { value: "reading", icon: BookOpen, label: "Reading" },
  { value: "visual", icon: Eye, label: "Visual" },
  { value: "listening", icon: Headphones, label: "Listening" },
  { value: "hands-on", icon: Wrench, label: "Hands-On" },
  { value: "combined", icon: Layers, label: "Combined" },
];

export default function LearningModulePage() {
  const { mid, id: skillTargetId } = useParams();
  const { normalizedAccount } = useAccount();
  const { updateSkillTarget, skillTargets } = useSkillTargets();
  const [learningMode, setLearningMode] = useState<LearningMode>("reading");
  const { substitute } = useContentSubstitution();

  const module = mid
    ? resolveModule(mid, skillTargets, normalizedAccount?.learningModules)
    : undefined;

  const [completed, setCompleted] = useState(false);

  if (!module) {
    return (
      <div className="flex items-center justify-center p-20 text-muted-foreground">
        Module not found.
      </div>
    );
  }

  // Find the step for this module
  const skillTarget = skillTargetId ? skillTargets.find(st => st.id === skillTargetId) : undefined;
  const step = skillTarget?.steps.find(s => s.referenceId === mid || s.id === mid);

  const handleMarkComplete = () => {
    if (!skillTargetId || !mid) return;

    updateSkillTarget(skillTargetId, (target) => {
      const sorted = [...target.steps].sort((a, b) => a.order - b.order);
      const stepIndex = sorted.findIndex(
        (s) => s.referenceId === mid || s.id === mid
      );

      const updatedSteps = target.steps.map((s) => {
        if (s.referenceId === mid || s.id === mid) {
          return { ...s, status: "completed" as const };
        }
        if (stepIndex >= 0) {
          const currentOrder = sorted[stepIndex].order;
          const nextLocked = sorted.find(
            (ns) => ns.order > currentOrder && ns.status === "locked"
          );
          if (nextLocked && s.id === nextLocked.id) {
            return { ...s, status: "available" as const };
          }
        }
        return s;
      });

      const doneCount = updatedSteps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      const progress = Math.round((doneCount / updatedSteps.length) * 100);

      return { ...target, steps: updatedSteps, progress };
    });

    setCompleted(true);
  };

  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Link
            to={`/skill-target/${skillTargetId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Skill Target
          </Link>

          {completed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-card border border-border p-8 shadow-card text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Module Complete!
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                You've completed{" "}
                <span className="font-medium text-foreground">{substitute(module.title)}</span>
              </p>
              <Link
                to={`/skill-target/${skillTargetId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Continue
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Module header with Mark as Complete */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card border border-border p-5 shadow-card mb-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        <BookOpen className="h-3 w-3" /> {module.contentType === "video" ? "Video" : "Document"}
                      </span>
                      {module.duration && (
                        <span className="text-xs text-muted-foreground">{module.duration}</span>
                      )}
                    </div>
                    <h1 className="font-display text-lg font-bold text-foreground">{substitute(module.title)}</h1>
                  </div>
                  <button
                    onClick={handleMarkComplete}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shrink-0 ml-4"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as Complete
                  </button>
                </div>
              </motion.div>

              {/* Learning Mode Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto mb-4">
                {modeOptions.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = learningMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setLearningMode(mode.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              {/* Rich content */}
              <EmbarkModuleContent
                module={module}
                learningModeOverride={learningMode}
                skillTargetId={skillTargetId}
                stepId={step?.id}
                onComplete={handleMarkComplete}
                learningFormat={step?.learningFormat}
                hideHeader
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
