import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import type { Assessment, SkillTarget, StepItem } from "@/types/learning";
import { mockSkillTargets, getPersonaSkillTargets } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { emitEvent } from "@/lib/agentOneEventEmitter";
import { applyGateActions } from "@/lib/assessmentGates";
import {
  analyzeAssessment,
  injectAdaptiveSteps,
  recomputeProgress,
  type AssessmentAnalysis,
} from "@/lib/retentionEngine";
import { emitEngagementEvent } from "@/lib/embarkEngagementEvents";

export interface RecordAssessmentResult {
  analysis: AssessmentAnalysis;
  insertedAdaptiveCount: number;
  consecutiveLowScores: number;
}

interface SkillTargetsContextType {
  skillTargets: SkillTarget[];
  addSkillTargets: (targets: SkillTarget[]) => void;
  updateSkillTarget: (id: string, updater: (target: SkillTarget) => SkillTarget) => void;
  /**
   * Single source of truth for assessment submissions across Embark + Skill Target views.
   * Applies gate actions, runs retention analysis, injects adaptive steps,
   * tracks struggling-streak, and emits engagement events.
   */
  recordAssessmentResult: (
    skillTargetId: string,
    assessment: Assessment,
    answers: Record<string, number>
  ) => RecordAssessmentResult;
}

const SkillTargetsContext = createContext<SkillTargetsContextType>({
  skillTargets: mockSkillTargets,
  addSkillTargets: () => {},
  updateSkillTarget: () => {},
  recordAssessmentResult: () => ({
    analysis: { overallScore: 0, passed: false, topicScores: [], weakTopics: [] },
    insertedAdaptiveCount: 0,
    consecutiveLowScores: 0,
  }),
});

const LOW_SCORE_THRESHOLD = 60;
const STRUGGLING_STREAK_TRIGGER = 2;

/**
 * Per-user skill target state.
 */
export function SkillTargetsProvider({ children }: { children: ReactNode }) {
  const { normalizedAccount, activeAccount, loading } = useAccount();
  const { user } = useUser();

  const getBaseTargets = useCallback((): SkillTarget[] => {
    if (Array.isArray(normalizedAccount?.skillTargets) && normalizedAccount.skillTargets.length) {
      return normalizedAccount.skillTargets;
    }
    if (Array.isArray(activeAccount?.data?.skillTargets) && activeAccount.data.skillTargets.length) {
      return activeAccount.data.skillTargets;
    }
    return mockSkillTargets;
  }, [normalizedAccount, activeAccount]);

  const [perUserTargets, setPerUserTargets] = useState<Record<string, SkillTarget[]>>({});

  const accountId = activeAccount?.id ?? "__default";
  const userId = user.id;
  const compositeKey = `${accountId}::${userId}`;

  useEffect(() => {
    if (loading) return;
    setPerUserTargets((prev) => {
      if (prev[compositeKey]) return prev;
      const base = getBaseTargets();
      const personalized = getPersonaSkillTargets(userId, base);
      const cloned = JSON.parse(JSON.stringify(personalized)) as SkillTarget[];
      return { ...prev, [compositeKey]: cloned };
    });
  }, [compositeKey, loading, getBaseTargets]);

  const accountIdRef = useState(accountId)[0];
  useEffect(() => {
    if (!loading && accountId !== accountIdRef) {
      // handled by compositeKey seeding above
    }
  }, [accountId, loading]);

  // Auto-unlock targets when their prerequisite is completed
  useEffect(() => {
    if (loading) return;
    const targets = perUserTargets[compositeKey];
    if (!targets) return;

    let changed = false;
    const updated = targets.map(target => {
      if (!target.locked || !target.prerequisiteId) return target;
      const prereq = targets.find(t => t.id === target.prerequisiteId);
      if (!prereq) return target;
      const prereqDone = prereq.progress >= 100 || prereq.steps.every(s => s.status === "completed" || s.status === "skipped");
      if (prereqDone) {
        changed = true;
        const steps = target.steps.map((s, i) => i === 0 ? { ...s, status: "available" as const } : s);
        return { ...target, locked: false, steps };
      }
      return target;
    });

    if (changed) {
      setPerUserTargets(prev => ({ ...prev, [compositeKey]: updated }));
    }
  }, [perUserTargets, compositeKey, loading]);

  const skillTargets = perUserTargets[compositeKey] ?? getPersonaSkillTargets(userId, getBaseTargets());

  const addSkillTargets = useCallback((targets: SkillTarget[]) => {
    setPerUserTargets((prev) => ({
      ...prev,
      [compositeKey]: [...(prev[compositeKey] ?? []), ...targets],
    }));
  }, [compositeKey]);

  const midpointEmitted = useRef<Set<string>>(new Set());

  const updateSkillTarget = useCallback((id: string, updater: (target: SkillTarget) => SkillTarget) => {
    setPerUserTargets((prev) => {
      const currentTargets = prev[compositeKey] ?? [];
      const oldTarget = currentTargets.find((st) => st.id === id);
      const updated = currentTargets.map((st) => (st.id === id ? updater(st) : st));
      const newTarget = updated.find((st) => st.id === id);

      if (
        oldTarget && newTarget &&
        oldTarget.progress < 50 && newTarget.progress >= 50 &&
        !midpointEmitted.current.has(`${compositeKey}::${id}`) &&
        normalizedAccount && activeAccount?.id
      ) {
        midpointEmitted.current.add(`${compositeKey}::${id}`);
        emitEvent({
          account_id: activeAccount.id,
          event_type: "onboarding_midpoint_reached",
          category: "onboarding_progress",
          source_employee_id: userId,
          target_employee_id: userId,
          related_employee_ids: [],
          related_skill_target_id: id,
          payload: { progress: newTarget.progress, skillTargetTitle: newTarget.title },
        }, normalizedAccount).catch(console.error);
      }

      return { ...prev, [compositeKey]: updated };
    });
  }, [compositeKey, normalizedAccount, activeAccount?.id, userId]);

  // Per-user consecutive-low-score counter (reset on a passing score)
  const consecutiveLowRef = useRef<Record<string, number>>({});

  const recordAssessmentResult = useCallback(
    (
      skillTargetId: string,
      assessment: Assessment,
      answers: Record<string, number>
    ): RecordAssessmentResult => {
      const analysis = analyzeAssessment(assessment, answers);

      // Update consecutive-low-score counter for this user
      const key = compositeKey;
      const prev = consecutiveLowRef.current[key] ?? 0;
      const next = analysis.overallScore < LOW_SCORE_THRESHOLD ? prev + 1 : 0;
      consecutiveLowRef.current[key] = next;

      // Apply gate actions + inject adaptive refresher steps if needed
      let insertedAdaptiveCount = 0;
      setPerUserTargets((prevState) => {
        const targets = prevState[key] ?? [];
        const updated = targets.map((target) => {
          if (target.id !== skillTargetId) return target;

          // 1. Standard gate logic
          const gated = applyGateActions(target.steps, assessment.id, analysis.overallScore);
          let nextSteps = gated.steps;

          // 2. Inject adaptive steps for weak topics (only if not perfect)
          if (analysis.weakTopics.length > 0) {
            const injected = injectAdaptiveSteps(
              nextSteps,
              assessment.id,
              analysis.weakTopics
            );
            nextSteps = injected.steps;
            insertedAdaptiveCount = injected.insertedCount;
          }

          return {
            ...target,
            steps: nextSteps,
            progress: recomputeProgress(nextSteps),
          };
        });
        return { ...prevState, [key]: updated };
      });

      // 3. Emit engagement events
      emitEngagementEvent({
        type: "assessment_completed",
        score: analysis.overallScore,
        moduleTitle: assessment.title ?? null,
      });

      if (analysis.weakTopics.length > 0 && insertedAdaptiveCount > 0) {
        emitEngagementEvent({
          type: "retention_gap_detected",
          weakTopics: analysis.weakTopics,
          score: analysis.overallScore,
          assessmentTitle: assessment.title ?? null,
          skillTargetId,
        });
      }

      if (next >= STRUGGLING_STREAK_TRIGGER) {
        emitEngagementEvent({
          type: "struggling_streak",
          consecutiveLowScores: next,
        });
      }

      return {
        analysis,
        insertedAdaptiveCount,
        consecutiveLowScores: next,
      };
    },
    [compositeKey]
  );

  return (
    <SkillTargetsContext.Provider value={{ skillTargets, addSkillTargets, updateSkillTarget, recordAssessmentResult }}>
      {children}
    </SkillTargetsContext.Provider>
  );
}

export const useSkillTargets = () => useContext(SkillTargetsContext);
