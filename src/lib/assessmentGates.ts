import { mockAssessments } from "@/data/mock";
import { st2BaselineAssessment, st2MidAssessment, st2FinalAssessment } from "@/data/rathbonesOnboarding";
import type { Assessment, SkillTarget, StepItem } from "@/types/learning";

/* ─── Static fallback map for known Rathbones step IDs → assessment IDs ─── */
export const STEP_TO_ASSESSMENT: Record<string, string> = {
  "RAT-ASM-001": "a-rb-st2-baseline",
  "RAT-ASM-002": "a-rb-st2-mid",
  "RAT-ASM-003": "a-rb-st2-final",
};

/* ─── Critical-fail threshold ─── */
export const CRITICAL_FAIL_THRESHOLD = 20;

/* ─── Gate actions ─── */
export interface GateAction {
  skip?: string[];
  unlock?: string[];
  complete?: string[];
  reset?: string[];
  retryId?: string;
}

export interface GateEntry {
  passThreshold: number;
  onPass: GateAction;
  onFail: GateAction;
}

export const GATE_MAP: Record<string, GateEntry> = {
  "a-rb-st2-baseline": {
    passThreshold: 80,
    onPass: {
      complete: ["RAT-ASM-001"],
      skip: ["RAT-LM-001", "RAT-LM-002", "RAT-LM-003"],
      unlock: ["RAT-LM-004"],
    },
    onFail: {
      complete: ["RAT-ASM-001"],
      unlock: ["RAT-LM-001"],
    },
  },
  "a-rb-st2-mid": {
    passThreshold: 80,
    onPass: {
      complete: ["RAT-ASM-002"],
      unlock: ["RAT-RP-001"],
    },
    onFail: {
      reset: ["RAT-LM-004", "RAT-LM-005", "RAT-LM-006", "RAT-LM-007"],
      retryId: "RAT-ASM-002",
    },
  },
  "a-rb-st2-final": {
    passThreshold: 80,
    onPass: {
      complete: ["RAT-ASM-003"],
    },
    onFail: {
      reset: ["RAT-RP-001"],
      retryId: "RAT-ASM-003",
    },
  },
};

/* ─── Deduplicated assessment catalog ─── */
const rathbonesAssessments = [st2BaselineAssessment, st2MidAssessment, st2FinalAssessment];
const rathbonesIds = new Set(rathbonesAssessments.map((a) => a.id));

export function getAllAssessments(): Assessment[] {
  return [...mockAssessments.filter((a) => !rathbonesIds.has(a.id)), ...rathbonesAssessments];
}

/* ─── Resolve an assessment from a step/assessment ID ─── */
export function resolveAssessment(
  aid: string,
  skillTargets: SkillTarget[]
): Assessment | null {
  const all = getAllAssessments();

  // 1. Direct match
  let found = all.find((a) => a.id === aid);
  if (found) return found;

  // 2. Search skill target steps for referenceId
  for (const target of skillTargets) {
    const step = target.steps.find((s) => s.id === aid && s.type === "assessment");
    if (step) {
      found = all.find((a) => a.id === step.referenceId);
      if (found) return found;
    }
  }

  // 3. Static fallback map
  const mappedId = STEP_TO_ASSESSMENT[aid];
  if (mappedId) {
    found = all.find((a) => a.id === mappedId);
    if (found) return found;
  }

  // 4. Generate fallback from step data — match by referenceId OR by step.id
  for (const target of skillTargets) {
    const step = target.steps.find(
      (s) => s.type === "assessment" && (s.referenceId === aid || s.id === aid)
    );
    if (step) {
      const isAdaptiveMicro = !!step.isAdaptive && (step.learningFormat === "micro" || step.learningFormat === "micro_refresher");
      const topicName = (step.topicTag || step.title.replace(/Pre-Assessment:|Post-Assessment:|Quick Check:/gi, "").trim()) || target.title || "General Knowledge";

      // Adaptive micro-check: short 3-question focused check on the weak topic
      if (isAdaptiveMicro) {
        return {
          id: aid,
          title: step.title,
          type: "post" as const,
          passingScore: 60,
          questions: [
            {
              id: `${aid}-q1`,
              question: `Which best describes the core idea behind ${topicName}?`,
              options: [
                "It's primarily about reducing costs",
                "It's about applying clear principles to real situations",
                "It's an optional skill for advanced practitioners",
                "It only applies in theoretical contexts",
              ],
              correctIndex: 1,
              topicTag: topicName,
            },
            {
              id: `${aid}-q2`,
              question: `When working with ${topicName}, the most reliable next step is to:`,
              options: [
                "Skip planning and act fast",
                "Assess the current situation before deciding",
                "Defer the decision indefinitely",
                "Copy what someone else did",
              ],
              correctIndex: 1,
              topicTag: topicName,
            },
            {
              id: `${aid}-q3`,
              question: `A strong indicator that you understand ${topicName} is:`,
              options: [
                "You can recite the definition",
                "You can apply it in a fresh, unfamiliar scenario",
                "You've heard the term used by colleagues",
                "You completed a related course years ago",
              ],
              correctIndex: 1,
              topicTag: topicName,
            },
          ],
        };
      }

      // Standard generated assessment: 5 questions split across 2 sub-topics
      const skills = target.skills?.map(s => s.name).filter(Boolean) ?? [];
      const topicA = skills[0] ?? topicName;
      const topicB = skills[1] ?? `${topicName} in Practice`;
      return {
        id: aid,
        title: step.title,
        type: (step.title.toLowerCase().includes("pre") ? "pre" : "post") as "pre" | "post",
        passingScore: 70,
        questions: [
          { id: `${aid}-q1`, question: `What is the primary objective of ${topicName}?`, options: ["Improve team collaboration", "Build core competency in this area", "Reduce operational costs", "Automate workflows"], correctIndex: 1, topicTag: topicA },
          { id: `${aid}-q2`, question: `Which best describes a key principle of ${topicName}?`, options: ["Avoid feedback loops", "Focus on continuous improvement", "Minimize stakeholder input", "Prioritize speed over quality"], correctIndex: 1, topicTag: topicA },
          { id: `${aid}-q3`, question: `When applying ${topicName} in practice, you should first:`, options: ["Skip the planning phase", "Assess the current state and gaps", "Implement changes immediately", "Delegate to others"], correctIndex: 1, topicTag: topicB },
          { id: `${aid}-q4`, question: `What is a common challenge when developing skills in ${topicName}?`, options: ["Too much available training", "Balancing theory with practice", "Lack of any resources", "No measurable outcomes"], correctIndex: 1, topicTag: topicB },
          { id: `${aid}-q5`, question: `The best indicator of proficiency in ${topicName} is:`, options: ["Years of experience alone", "Ability to apply concepts in real scenarios", "Number of certifications", "Memorizing definitions"], correctIndex: 1, topicTag: topicA },
        ],
      };
    }
  }

  return null;
}

/* ─── Critical-fail result (for callers that need to know which modules were reopened) ─── */
export interface CriticalFailResult {
  triggered: boolean;
  reopenedModuleTitles: string[];
}

/* ─── Apply gate actions to steps after assessment submission ─── */
export function applyGateActions(
  steps: StepItem[],
  assessmentId: string,
  score: number
): { steps: StepItem[]; progress: number; criticalFail: CriticalFailResult } {
  const gate = GATE_MAP[assessmentId];
  const isCriticalFail = score < CRITICAL_FAIL_THRESHOLD;

  // Mark the assessment step itself — completed by default, OR locked on critical fail
  let updatedSteps = steps.map((step) => {
    const isThisAssessment =
      (step.referenceId === assessmentId && step.type === "assessment") ||
      (STEP_TO_ASSESSMENT[step.id] === assessmentId && step.type === "assessment") ||
      (step.id === assessmentId && step.type === "assessment");
    if (isThisAssessment) {
      return {
        ...step,
        status: (isCriticalFail ? "locked" : "completed") as StepItem["status"],
        criticallyLocked: isCriticalFail || step.criticallyLocked,
      };
    }
    return step;
  });

  // Find the assessment step (for ordering)
  const assessmentStep = updatedSteps.find(
    (s) =>
      s.type === "assessment" &&
      (s.referenceId === assessmentId || STEP_TO_ASSESSMENT[s.id] === assessmentId || s.id === assessmentId)
  );

  let reopenedModuleTitles: string[] = [];

  if (isCriticalFail && assessmentStep) {
    // Critical fail — reopen source modules
    let moduleIdsToReopen: Set<string> = new Set();

    if (gate) {
      // Use gate map heuristic: any module step listed across the gate's actions
      const gateStepIds = new Set([
        ...(gate.onPass.skip ?? []),
        ...(gate.onPass.complete ?? []),
        ...(gate.onPass.unlock ?? []),
        ...(gate.onFail.reset ?? []),
        ...(gate.onFail.unlock ?? []),
      ]);
      updatedSteps.forEach((s) => {
        if (s.type === "module" && gateStepIds.has(s.id)) {
          moduleIdsToReopen.add(s.id);
        }
      });
    }

    // If gate yielded nothing, fallback: all preceding completed/skipped non-adaptive modules in the same target
    if (moduleIdsToReopen.size === 0) {
      updatedSteps.forEach((s) => {
        if (
          s.type === "module" &&
          !s.isAdaptive &&
          s.order < assessmentStep.order &&
          (s.status === "completed" || s.status === "skipped")
        ) {
          moduleIdsToReopen.add(s.id);
        }
      });
    }

    updatedSteps = updatedSteps.map((s) => {
      if (moduleIdsToReopen.has(s.id)) {
        reopenedModuleTitles.push(s.title);
        return { ...s, status: "available" as const };
      }
      return s;
    });
  } else if (gate) {
    const passed = score >= gate.passThreshold;
    const actions = passed ? gate.onPass : gate.onFail;

    updatedSteps = updatedSteps.map((step) => {
      if (actions.complete?.includes(step.id)) return { ...step, status: "completed" as const };
      if (actions.skip?.includes(step.id)) return { ...step, status: "skipped" as const };
      if (actions.unlock?.includes(step.id)) return { ...step, status: "available" as const };
      if (actions.reset?.includes(step.id)) return { ...step, status: "available" as const };
      if (!passed && actions.retryId === step.id) return { ...step, status: "available" as const };
      return step;
    });
  } else if (assessmentStep) {
    // No gate — unlock the next locked step
    const sorted = [...updatedSteps].sort((a, b) => a.order - b.order);
    const nextLocked = sorted.find((s) => s.order > assessmentStep.order && s.status === "locked");
    if (nextLocked) {
      updatedSteps = updatedSteps.map((s) =>
        s.id === nextLocked.id ? { ...s, status: "available" as const } : s
      );
    }
  }

  const completedCount = updatedSteps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  const progress = Math.round((completedCount / updatedSteps.length) * 100);

  return {
    steps: updatedSteps,
    progress,
    criticalFail: { triggered: isCriticalFail, reopenedModuleTitles },
  };
}
