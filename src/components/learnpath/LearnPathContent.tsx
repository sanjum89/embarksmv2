import { useLearnPath } from "@/contexts/LearnPathContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { resolveModule, buildCatalog } from "@/lib/learnPathModuleResolver";
import { LearnPathModuleCard } from "./LearnPathModuleCard";
import { LearnPathModuleContent } from "./LearnPathModuleContent";
import { LearnPathAssessment } from "./LearnPathAssessment";
import { LearnPathModeSelector } from "./LearnPathModeSelector";
import { BookOpen, GraduationCap, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getRecommendationsForUser } from "@/lib/skillRecommendations";
import { useEffect, useRef } from "react";

export function LearnPathContent() {
  const { contentView, activeModuleId, assessmentModuleId, showModuleGrid, openModule } = useLearnPath();
  const { skillTargets } = useSkillTargets();
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const navigate = useNavigate();
  const autoResumedRef = useRef(false);

  const catalog = buildCatalog(normalizedAccount?.learningModules);

  // Gather all module steps from skill targets
  const moduleSteps = skillTargets.flatMap((st) =>
    st.steps
      .filter((s) => s.type === "module")
      .map((s) => {
        const mod = resolveModule(s.referenceId ?? s.id, skillTargets, normalizedAccount?.learningModules);
        return {
          moduleId: mod?.id ?? s.referenceId ?? s.id,
          title: mod?.title ?? s.title,
          description: mod?.transcript?.slice(0, 120) ?? s.description,
          duration: mod?.duration ?? s.duration,
          contentType: mod?.contentType ?? "document",
          status: s.status,
          skillTargetId: st.id,
          skillTargetTitle: st.title,
          progress: st.progress,
          learningFormat: s.learningFormat,
          stepId: s.id,
        };
      })
  );

  const hasModules = moduleSteps.length > 0;

  // Auto-resume: open first incomplete module on mount
  useEffect(() => {
    if (autoResumedRef.current || !hasModules || contentView !== "welcome") return;
    autoResumedRef.current = true;
    const resume = moduleSteps.find((m) => m.status === "in_progress") ?? moduleSteps.find((m) => m.status === "available");
    if (resume) {
      openModule(resume.moduleId, resume.skillTargetId);
    }
  }, [hasModules, contentView]);

  // Get skill gap recommendations for empty state
  const profileData = normalizedAccount?.profileData?.[user.id];
  const { groups: recommendationGroups } = getRecommendationsForUser(profileData);

  if (contentView === "assessment" && assessmentModuleId) {
    return <LearnPathAssessment moduleId={assessmentModuleId} />;
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
    const stepInfo = moduleSteps.find((ms) => ms.moduleId === activeModuleId);
    return (
      <div className="h-full flex flex-col">
        <LearnPathModeSelector skillTargetTitle={stepInfo?.skillTargetTitle} />
        <div className="flex-1 overflow-y-auto">
          <LearnPathModuleContent
            module={mod}
            skillTargetTitle={stepInfo?.skillTargetTitle}
            learningFormat={stepInfo?.learningFormat}
            skillTargetId={stepInfo?.skillTargetId}
            stepId={stepInfo?.stepId}
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
            <h2 className="text-lg font-semibold text-foreground">Your Learning Modules</h2>
          </div>
          {moduleSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules assigned yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {moduleSteps.map((ms) => (
                <LearnPathModuleCard key={`${ms.skillTargetId}-${ms.moduleId}`} step={ms} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state — no skill targets assigned
  if (!hasModules) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">No Learning Path Yet</h1>
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

  // Welcome (has modules but hasn't navigated yet — shouldn't typically show due to auto-resume)
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center space-y-4 px-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to LearnPath</h1>
        <p className="text-muted-foreground text-sm">
          Your AI Learning Manager will guide you through your assigned modules, adapting content
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
