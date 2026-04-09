import { mockAssessments } from "@/data/mock";
import { st2BaselineAssessment, st2MidAssessment, st2FinalAssessment } from "@/data/rathbonesOnboarding";
import type { Assessment, SkillTarget, StepItem } from "@/types/learning";

/* ─── Static fallback map for known Rathbones step IDs → assessment IDs ─── */
export const STEP_TO_ASSESSMENT: Record<string, string> = {
  "RAT-ASM-001": "a-rb-st2-baseline",
  "RAT-ASM-002": "a-rb-st2-mid",
  "RAT-ASM-003": "a-rb-st2-final",
};

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

  // 4. Generate fallback from step data
  for (const target of skillTargets) {
    const step = target.steps.find((s) => s.referenceId === aid);
    if (step) {
      const topicName = step.title.replace(/Pre-Assessment:|Post-Assessment:/gi, "").trim() || target.title || "General Knowledge";
      return {
        id: aid,
        title: step.title,
        type: (step.title.toLowerCase().includes("pre") ? "pre" : "post") as "pre" | "post",
        passingScore: 70,
        questions: [
          { id: `${aid}-q1`, question: `What is the primary objective of ${topicName}?`, options: ["Improve team collaboration", "Build core competency in this area", "Reduce operational costs", "Automate workflows"], correctIndex: 1 },
          { id: `${aid}-q2`, question: `Which best describes a key principle of ${topicName}?`, options: ["Avoid feedback loops", "Focus on continuous improvement", "Minimize stakeholder input", "Prioritize speed over quality"], correctIndex: 1 },
          { id: `${aid}-q3`, question: `When applying ${topicName} in practice, you should first:`, options: ["Skip the planning phase", "Assess the current state and gaps", "Implement changes immediately", "Delegate to others"], correctIndex: 1 },
          { id: `${aid}-q4`, question: `What is a common challenge when developing skills in ${topicName}?`, options: ["Too much available training", "Balancing theory with practice", "Lack of any resources", "No measurable outcomes"], correctIndex: 1 },
          { id: `${aid}-q5`, question: `The best indicator of proficiency in ${topicName} is:`, options: ["Years of experience alone", "Ability to apply concepts in real scenarios", "Number of certifications", "Memorizing definitions"], correctIndex: 1 },
        ],
      };
    }
  }

  return null;
}

/* ─── Apply gate actions to steps after assessment submission ─── */
export function applyGateActions(
  steps: StepItem[],
  assessmentId: string,
  score: number
): { steps: StepItem[]; progress: number } {
  const gate = GATE_MAP[assessmentId];

  // Mark the assessment step itself as completed
  let updatedSteps = steps.map((step) => {
    if (step.referenceId === assessmentId && step.type === "assessment") {
      return { ...step, status: "completed" as const };
    }
    // Also match by step ID via STEP_TO_ASSESSMENT
    const mappedAssessmentId = STEP_TO_ASSESSMENT[step.id];
    if (mappedAssessmentId === assessmentId && step.type === "assessment") {
      return { ...step, status: "completed" as const };
    }
    return step;
  });

  if (gate) {
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
  } else {
    // Fallback: unlock the next locked step
    const assessmentStep = updatedSteps.find(
      (s) => (s.referenceId === assessmentId || STEP_TO_ASSESSMENT[s.id] === assessmentId) && s.type === "assessment"
    );
    if (assessmentStep) {
      const sorted = [...updatedSteps].sort((a, b) => a.order - b.order);
      const nextLocked = sorted.find((s) => s.order > assessmentStep.order && s.status === "locked");
      if (nextLocked) {
        updatedSteps = updatedSteps.map((s) =>
          s.id === nextLocked.id ? { ...s, status: "available" as const } : s
        );
      }
    }
  }

  const completedCount = updatedSteps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  const progress = Math.round((completedCount / updatedSteps.length) * 100);

  return { steps: updatedSteps, progress };
}
