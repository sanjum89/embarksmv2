import { useEmbark } from "@/contexts/LearnPathContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { resolveModule, buildCatalog } from "@/lib/learnPathModuleResolver";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { EmbarkModuleCard } from "./LearnPathModuleCard";
import { EmbarkModuleContent } from "./LearnPathModuleContent";
import { EmbarkAssessment } from "./LearnPathAssessment";
import { EmbarkModeSelector } from "./LearnPathModeSelector";
import { BookOpen, GraduationCap, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getRecommendationsForUser } from "@/lib/skillRecommendations";
import { getAssignedSkillTargetsForUser, orderSkillTargets } from "@/lib/skillTargetSequence";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StepType } from "@/types/learning";

export interface UnifiedStep {
  stepId: string;
  moduleId: string;
  type: StepType;
  title: string;
  description: string;
  duration?: string;
  contentType: string;
  status: string;
  skillTargetId: string;
  skillTargetTitle: string;
  progress: number;
  learningFormat?: string;
  referenceId: string;
}

export function EmbarkContent() {
  const { contentView, activeModuleId, assessmentModuleId, showModuleGrid, openModule, openAssessment, notifyModuleCompleted } = useEmbark();
  const { skillTargets } = useSkillTargets();
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const navigate = useNavigate();
  const { substitute } = useContentSubstitution();
  const autoResumedRef = useRef(false);
  const [moduleCompletedView, setModuleCompletedView] = useState(false);

  const catalog = buildCatalog(normalizedAccount?.learningModules);

  const userTargets = useMemo(
    () => getAssignedSkillTargetsForUser(skillTargets, user.id),
    [skillTargets, user.id],
  );

  const sortedTargets = useMemo(() => orderSkillTargets(userTargets), [userTargets]);

  // Include ALL step types in order (modules, assessments, role plays)
  // Force locked status for steps whose parent skill target is locked
  const allSteps: UnifiedStep[] = sortedTargets.flatMap((st) =>
    [...st.steps]
      .sort((a, b) => a.order - b.order)
      .map((s) => {
        const mod = s.type === "module"
          ? resolveModule(s.referenceId ?? s.id, skillTargets, normalizedAccount?.learningModules)
          : undefined;
        const effectiveStatus = st.locked ? "locked" : s.status;
        return {
          stepId: s.id,
          moduleId: mod?.id ?? s.referenceId ?? s.id,
          type: s.type,
          title: substitute(mod?.title ?? s.title),
          description: substitute(mod?.transcript?.slice(0, 120) ?? s.description),
          duration: mod?.duration ?? s.duration,
          contentType: s.type === "assessment" ? "assessment" : s.type === "role_play" ? "role_play" : (mod?.contentType ?? "document"),
          status: effectiveStatus,
          skillTargetId: st.id,
          skillTargetTitle: substitute(st.title),
          progress: st.progress,
          learningFormat: s.learningFormat,
          referenceId: s.referenceId ?? s.id,
        };
      })
  );

  const hasSteps = allSteps.length > 0;

  // Auto-resume: open first incomplete step on mount
  useEffect(() => {
    if (autoResumedRef.current || !hasSteps || contentView !== "welcome") return;
    autoResumedRef.current = true;
    const resume = allSteps.find((s) => s.status === "in_progress") ?? allSteps.find((s) => s.status === "available");
    if (resume) {
      if (resume.type === "assessment") {
        openAssessment(resume.stepId);
      } else {
        openModule(resume.moduleId, resume.skillTargetId);
      }
    }
  }, [hasSteps, contentView]);

  // Get skill gap recommendations for empty state
  const profileData = normalizedAccount?.profileData?.[user.id];
  const { groups: recommendationGroups } = getRecommendationsForUser(profileData);

  // Assessment view
  if (contentView === "assessment" && assessmentModuleId) {
    const stepInfo = allSteps.find((s) => s.stepId === assessmentModuleId || s.moduleId === assessmentModuleId);
    const currentIdx = allSteps.findIndex((s) => s.stepId === assessmentModuleId || s.moduleId === assessmentModuleId);
    const nextStep = allSteps.slice(currentIdx + 1).find((s) => s.status !== "completed" && s.status !== "skipped");

    return (
      <EmbarkAssessment
        assessmentId={assessmentModuleId}
        skillTargetId={stepInfo?.skillTargetId}
        stepId={stepInfo?.stepId}
        nextStepId={nextStep?.type === "assessment" ? nextStep.stepId : nextStep?.moduleId}
        nextStepTitle={nextStep?.title}
        nextStepType={nextStep?.type}
        nextSkillTargetId={nextStep?.skillTargetId}
      />
    );
  }

  if (contentView === "module" && activeModuleId) {
    const mod = resolveModule(activeModuleId, skillTargets, normalizedAccount?.learningModules);
    if (!mod) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Module not found.
        </div>
      );
    }
    const stepInfo = allSteps.find((ms) => ms.moduleId === activeModuleId);

    const currentIdx = allSteps.findIndex((ms) => ms.moduleId === activeModuleId);
    const nextStep = allSteps.slice(currentIdx + 1).find((s) => s.status !== "completed" && s.status !== "skipped");

    const handleModuleComplete = () => {
      notifyModuleCompleted({
        moduleId: activeModuleId,
        moduleTitle: stepInfo?.title ?? mod.title ?? activeModuleId,
        nextModuleId: nextStep?.type === "assessment" ? nextStep.stepId : nextStep?.moduleId,
        nextModuleTitle: nextStep?.title,
        skillTargetId: nextStep?.skillTargetId ?? stepInfo?.skillTargetId,
      });
    };

    return (
      <div className="h-full flex flex-col">
        {!moduleCompletedView && (
          <EmbarkModeSelector skillTargetTitle={stepInfo?.skillTargetTitle} />
        )}
        <div className="flex-1 overflow-y-auto">
          <EmbarkModuleContent
            key={mod.id}
            module={mod}
            skillTargetTitle={stepInfo?.skillTargetTitle}
            learningFormat={stepInfo?.learningFormat as any}
            skillTargetId={stepInfo?.skillTargetId}
            stepId={stepInfo?.stepId}
            onComplete={handleModuleComplete}
            nextModuleId={nextStep?.type === "assessment" ? nextStep.stepId : nextStep?.moduleId}
            nextModuleTitle={nextStep?.title}
            nextSkillTargetId={nextStep?.skillTargetId}
            nextStepType={nextStep?.type}
            initialCompleted={stepInfo?.status === "completed"}
            onCompletedChange={setModuleCompletedView}
          />
        </div>
      </div>
    );
  }

  if (contentView === "modules") {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Your Embark Journey</h2>
          </div>
          {allSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chapters assigned yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allSteps.map((step) => (
                <EmbarkModuleCard key={`${step.skillTargetId}-${step.stepId}`} step={step} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state — no skill targets assigned
  if (!hasSteps) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">No Learning Journey Yet</h1>
            <p className="text-sm text-muted-foreground">
              You don't have any skill targets assigned. Based on your profile, here are some skill gaps you could work on.
            </p>
          </div>

          {recommendationGroups.length > 0 ? (
            <div className="space-y-4">
              {recommendationGroups.map((group) => (
                <div key={group.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                  <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {group.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground text-center">
                No skill gaps detected. Speak with your manager to get skill targets assigned.
              </p>
            </div>
          )}

          <Button onClick={() => navigate("/")} className="w-full gap-2">
            <ArrowRight className="h-4 w-4" />
            Go to Dashboard to Add Skill Targets
          </Button>
        </div>
      </div>
    );
  }

  // Welcome (has steps but hasn't navigated yet — shouldn't typically show due to auto-resume)
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center space-y-4 px-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to Embark AI</h1>
        <p className="text-muted-foreground text-sm">
          Your AI learning companion will guide you through your assigned modules, adapting content
          to your preferred learning style. Start a conversation on the left, or browse your modules.
        </p>
        <Button onClick={showModuleGrid} variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Browse Modules
        </Button>
      </div>
    </div>
  );
}
