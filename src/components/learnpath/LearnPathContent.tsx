import { useLearnPath } from "@/contexts/LearnPathContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { expandedModules } from "@/data/contentModules";
import { LearnPathModuleCard } from "./LearnPathModuleCard";
import { LearnPathModuleContent } from "./LearnPathModuleContent";
import { LearnPathAssessment } from "./LearnPathAssessment";
import { LearnPathModeSelector } from "./LearnPathModeSelector";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LearnPathContent() {
  const { contentView, activeModuleId, assessmentModuleId, showModuleGrid } = useLearnPath();
  const { skillTargets } = useSkillTargets();
  const { user } = useUser();

  // Gather all module steps from skill targets
  const moduleSteps = skillTargets.flatMap((st) =>
    st.steps
      .filter((s) => s.type === "module")
      .map((s) => {
        const mod = expandedModules.find((m) => m.id === s.referenceId);
        return {
          moduleId: s.referenceId,
          title: mod?.title ?? s.title,
          description: mod?.transcript?.slice(0, 120) ?? s.description,
          duration: mod?.duration ?? s.duration,
          contentType: mod?.contentType ?? "document",
          status: s.status,
          skillTargetId: st.id,
          skillTargetTitle: st.title,
          progress: st.progress,
        };
      })
  );

  if (contentView === "assessment" && assessmentModuleId) {
    return <LearnPathAssessment moduleId={assessmentModuleId} />;
  }

  if (contentView === "module" && activeModuleId) {
    const mod = expandedModules.find((m) => m.id === activeModuleId);
    if (!mod) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Module not found.
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col">
        <LearnPathModeSelector />
        <div className="flex-1 overflow-y-auto">
          <LearnPathModuleContent module={mod} />
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

  // Welcome
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
