import { useEmbark } from "@/contexts/LearnPathContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { resolveModule, buildCatalog } from "@/lib/learnPathModuleResolver";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { useLearnerJourney } from "@/hooks/useLearnerJourney";
import { useCatalogChapter, composeChapterTranscript, composeDiagnosticTranscriptFromChapters } from "@/hooks/useCatalogChapter";
import { useCatalogChaptersForModule } from "@/hooks/useCatalogChaptersForModule";
import { diagnosticReopens, useDiagnosticReopens } from "@/store/useDiagnosticReopens";
import { EmbarkJourneyView } from "./EmbarkJourneyView";
import { EmbarkLoadingState } from "./EmbarkLoadingState";
import { EmbarkModuleContent } from "./LearnPathModuleContent";
import { EmbarkAssessment } from "./LearnPathAssessment";
import { EmbarkModeSelector } from "./LearnPathModeSelector";
import { ExplainSelectionPopover } from "./ExplainSelectionPopover";
import { GraduationCap, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
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
  const { contentView, activeModuleId, assessmentModuleId, showModuleGrid, openModule, openAssessment, notifyModuleCompleted, canGoBack, goBack } = useEmbark();
  const { skillTargets } = useSkillTargets();
  const { user } = useUser();
  const { activeAccountId, normalizedAccount } = useAccount();
  const navigate = useNavigate();
  const { substitute } = useContentSubstitution();
  const autoResumedRef = useRef(false);
  const [moduleCompletedView, setModuleCompletedView] = useState(false);

  const employeeId =
    normalizedAccount?.usersById?.[user.id]?.linkedEmployeeId || user.id;
  const { journey, isLoading: journeyLoading, refresh: refreshJourney } = useLearnerJourney(activeAccountId, employeeId);
  const hasJourney = !!journey && journey.tracks.some((t) => t.totalChapters > 0);
  const diagState = useDiagnosticReopens();

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

  // Auto-resume: open first incomplete step on mount (legacy accounts only)
  useEffect(() => {
    if (autoResumedRef.current || !hasSteps || contentView !== "welcome" || hasJourney) return;
    autoResumedRef.current = true;
    const resume = allSteps.find((s) => s.status === "in_progress") ?? allSteps.find((s) => s.status === "available");
    if (resume) {
      if (resume.type === "assessment") {
        openAssessment(resume.stepId);
      } else {
        openModule(resume.moduleId, resume.skillTargetId);
      }
    }
  }, [hasSteps, contentView, hasJourney]);

  // Reset completion-view flag when active module changes (so mode selector returns)
  useEffect(() => {
    setModuleCompletedView(false);
  }, [activeModuleId]);

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

  // Detect synthetic Quick Diagnostic activeModuleId of the form `__diag::<moduleCode>`.
  const diagModuleCode = useMemo(() => {
    if (!activeModuleId || !activeModuleId.startsWith("__diag::")) return null;
    return activeModuleId.slice("__diag::".length);
  }, [activeModuleId]);

  // Determine if activeModuleId is a cohort chapter code, and look up its adaptation lens.
  const cohortChapterCode = useMemo(() => {
    if (!activeModuleId || !journey || diagModuleCode) return null;
    for (const t of journey.tracks) {
      for (const m of t.modules) {
        if (m.chapters.some((c) => c.code === activeModuleId)) return activeModuleId;
      }
    }
    return null;
  }, [activeModuleId, journey, diagModuleCode]);

  const cohortAdaptationType = useMemo(() => {
    if (!cohortChapterCode || !journey) return null;
    for (const t of journey.tracks) {
      for (const m of t.modules) {
        if (m.chapters.some((c) => c.code === cohortChapterCode)) {
          return m.adaptation?.adaptationType ?? null;
        }
      }
    }
    return null;
  }, [cohortChapterCode, journey]);

  const { chapter: cohortChapterRow } = useCatalogChapter(activeAccountId, cohortChapterCode);

  // Quick Diagnostic — fetch ALL chapters of the active module so questions
  // span the chapters being skipped, not just the first one.
  const { chapters: diagChapters } = useCatalogChaptersForModule(activeAccountId, diagModuleCode);
  const diagModuleMeta = useMemo(() => {
    if (!diagModuleCode || !journey) return null;
    for (const t of journey.tracks) {
      for (const m of t.modules) {
        if (m.code === diagModuleCode) return { title: m.title, module: m, track: t };
      }
    }
    return null;
  }, [diagModuleCode, journey]);

  if (contentView === "module" && activeModuleId) {
    let mod = resolveModule(activeModuleId, skillTargets, normalizedAccount?.learningModules);

    // Cohort path: when the active ID is a cohort chapter, render REAL DB content.
    if (cohortChapterRow && cohortChapterCode === activeModuleId) {
      const lens =
        cohortAdaptationType === "microlearning"
          ? "condensed"
          : cohortAdaptationType === "evidence_required"
            ? "evidence"
            : "full";
      const transcript = composeChapterTranscript(cohortChapterRow, lens);
      const minutes =
        lens === "evidence" ? 15 : cohortChapterRow.estimatedTimeMinutes || 25;
      const displayTitle =
        lens === "evidence"
          ? "Submit evidence — short written task"
          : cohortChapterRow.chapterTitle;
      mod = {
        id: cohortChapterRow.chapterCode,
        title: displayTitle,
        contentType: "document",
        contentUrl: "",
        transcript,
        duration: `${minutes} min`,
      };
    } else if (diagModuleCode && diagChapters.length > 0 && diagModuleMeta) {
      // Synthetic Quick Diagnostic — module-level, all chapters
      const transcript = composeDiagnosticTranscriptFromChapters(
        diagChapters,
        diagModuleMeta.title,
      );
      mod = {
        id: activeModuleId,
        title: "Quick diagnostic — 3 questions",
        contentType: "document",
        contentUrl: "",
        transcript,
        duration: "5 min",
      };
    } else if (!mod && journey) {
      // Last-ditch synthesis if a journey chapter exists but DB row hasn't loaded yet
      for (const t of journey.tracks) {
        for (const m of t.modules) {
          const ch = m.chapters.find((c) => c.code === activeModuleId);
          if (ch) {
            mod = {
              id: ch.code,
              title: ch.title,
              contentType: (ch.contentType as any) ?? "document",
              contentUrl: "",
              transcript: `# ${ch.title}\n\nLoading chapter content…`,
              duration: ch.minutes ? `${ch.minutes} min` : "5 min",
            };
            break;
          }
        }
        if (mod) break;
      }
    }

    if (!mod) {
      // If this ID belongs to a role-play step, route to the role-play page instead of "unavailable"
      const rpStep = allSteps.find(
        (s) => s.type === "role_play" && (s.stepId === activeModuleId || s.moduleId === activeModuleId || s.referenceId === activeModuleId)
      );
      if (rpStep) {
        navigate(`/role-play/${rpStep.referenceId ?? rpStep.stepId}`);
        return null;
      }
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Chapter unavailable</h3>
              <p className="text-sm text-muted-foreground">
                We couldn't load this chapter. It may have been moved or replaced.
              </p>
            </div>
            <Button onClick={showModuleGrid} variant="outline" className="w-full gap-2">
              <ArrowRight className="h-4 w-4" />
              Back to all chapters
            </Button>
          </div>
        </div>
      );
    }
    const stepInfo = allSteps.find((ms) => ms.moduleId === activeModuleId);

    const currentIdx = allSteps.findIndex((ms) => ms.moduleId === activeModuleId);
    const nextStep = allSteps.slice(currentIdx + 1).find((s) => s.status !== "completed" && s.status !== "skipped");

    // For Quick Diagnostic submissions: pre-compute the chapter to advance to.
    // Priority: first wrong-answer chapter (reopened) → first non-skipped chapter
    // in the next cohort module → legacy nextStep.
    const computeDiagnosticNext = (wrongChapterCodes: string[]) => {
      if (!diagModuleCode || !diagModuleMeta) return null;
      if (wrongChapterCodes.length > 0) {
        const orderedWrong = diagModuleMeta.module.chapters
          .filter((c) => wrongChapterCodes.includes(c.code))
          .map((c) => ({ id: c.code, title: c.title }));
        if (orderedWrong[0]) return orderedWrong[0];
      }
      // No wrong chapters → next module in the track
      const trackModules = diagModuleMeta.track.modules;
      const idx = trackModules.findIndex((m) => m.code === diagModuleCode);
      const next = trackModules.slice(idx + 1).find((m) => m.chapters.length > 0);
      const ch = next?.chapters[0];
      return ch ? { id: ch.code, title: ch.title } : null;
    };

    const handleModuleComplete = () => {
      notifyModuleCompleted({
        moduleId: activeModuleId,
        moduleTitle: stepInfo?.title ?? mod.title ?? activeModuleId,
        nextModuleId: nextStep?.type === "assessment" ? nextStep.stepId : nextStep?.moduleId,
        nextModuleTitle: nextStep?.title,
        nextStepType: nextStep?.type,
        skillTargetId: nextStep?.skillTargetId ?? stepInfo?.skillTargetId,
      });
    };

    // Override "next" prop on the diagnostic screen so the CompletionScreen
    // auto-advances into the first reopened chapter (or the next module).
    let diagNext: { id: string; title: string } | null = null;
    if (diagModuleCode) {
      const recorded = diagState[diagModuleCode];
      if (recorded) {
        diagNext = computeDiagnosticNext(Array.from(recorded.reopened));
      }
    }

    return (
      <div className="h-full flex flex-col">
        <ExplainSelectionPopover />
        {!moduleCompletedView && (
          <EmbarkModeSelector skillTargetTitle={stepInfo?.skillTargetTitle} />
        )}
        <div className="flex-1 overflow-y-auto" data-explainable="true">
          <EmbarkModuleContent
            key={mod.id}
            module={mod}
            skillTargetTitle={stepInfo?.skillTargetTitle}
            learningFormat={stepInfo?.learningFormat as any}
            skillTargetId={stepInfo?.skillTargetId}
            stepId={stepInfo?.stepId}
            onComplete={handleModuleComplete}
            nextModuleId={diagNext?.id ?? (nextStep?.type === "assessment" ? nextStep.stepId : nextStep?.moduleId)}
            nextModuleTitle={diagNext?.title ?? nextStep?.title}
            nextSkillTargetId={nextStep?.skillTargetId}
            nextStepType={diagNext ? "module" : nextStep?.type}
            initialCompleted={stepInfo?.status === "completed"}
            onCompletedChange={setModuleCompletedView}
            onDiagnosticSubmit={(result) => {
              if (!diagModuleCode) return;
              diagnosticReopens.recordSubmission(
                diagModuleCode,
                result.wrongChapterCodes,
                result.total,
                result.correctCount,
              );
            }}
          />
        </div>
      </div>
    );
  }

  if (contentView === "modules") {
    return (
      <EmbarkJourneyView legacySteps={allSteps} activeChapterId={activeModuleId} />
    );
  }

  // Cohort journey learners (e.g., Rathbones) — show journey as default view
  if (hasJourney) {
    return (
      <EmbarkJourneyView legacySteps={allSteps} activeChapterId={activeModuleId} />
    );
  }

  // Empty state — no skill targets assigned and no cohort journey
  if (!hasSteps) {
    if (journeyLoading) {
      return <EmbarkLoadingState />;
    }
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">No Learning Journey Yet</h1>
            <p className="text-sm text-muted-foreground">
              You're not enrolled in a cohort yet. Based on your profile, here are some skill areas you could start exploring.
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
