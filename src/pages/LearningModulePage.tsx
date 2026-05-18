import { useState } from "react";
import { useParams } from "react-router-dom";

import { CheckCircle2, Eye, BookOpen, Headphones, Wrench, Layers } from "lucide-react";

import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAccount } from "@/contexts/AccountContext";
import { resolveModule } from "@/lib/learnPathModuleResolver";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { EmbarkModuleContent } from "@/components/learnpath/LearnPathModuleContent";
import type { LearningMode } from "@/contexts/LearnPathContext";
import PageHeader from "@/components/layout/PageHeader";
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

  const skillTarget = skillTargetId ? skillTargets.find(st => st.id === skillTargetId) : undefined;
  const step = skillTarget?.steps.find(s => s.referenceId === mid || s.id === mid);

  const [innerCompleted, setInnerCompleted] = useState(step?.status === "completed");

  if (!module) {
    return (
      <div className="flex items-center justify-center p-20 text-muted-foreground">
        Module not found.
      </div>
    );
  }

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
  };

  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden flex-col">
      <PageHeader
        title={substitute(module.title)}
        subtitle={`${module.contentType === "video" ? "Video" : "Document"}${module.duration ? ` · ${module.duration}` : ""}`}
        breadcrumbs={[
          { label: "Skill Targets", to: "/manager/skill-targets" },
          { label: skillTarget?.title ?? "Target", to: skillTargetId ? `/skill-target/${skillTargetId}` : undefined },
          { label: substitute(module.title) },
        ]}
        actions={
          !innerCompleted ? (
            <button
              onClick={handleMarkComplete}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark as Complete
            </button>
          ) : null
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Learning Mode Selector — hidden once completion screen renders */}
          {!innerCompleted && (
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
          )}

          {/* Rich content — handles its own completion screen with auto-advance */}
          <EmbarkModuleContent
            key={module.id}
            module={module}
            learningModeOverride={learningMode}
            skillTargetId={skillTargetId}
            stepId={step?.id}
            onComplete={handleMarkComplete}
            learningFormat={step?.learningFormat}
            hideHeader
            initialCompleted={step?.status === "completed"}
            onCompletedChange={setInnerCompleted}
          />
        </div>
      </div>
    </div>
  );
}
