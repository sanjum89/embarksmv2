/**
 * Retention Engine
 *
 * Pure logic — analyzes assessment results by topic, decides whether to
 * inject adaptive steps (micro refreshers) or reopen failed modules,
 * and computes recovery state.
 *
 * Used by both Embark AI and Skill Target views via SkillTargetsContext.
 */

import type {
  Assessment,
  AssessmentQuestion,
  SkillTarget,
  StepItem,
} from "@/types/learning";

const WEAK_TOPIC_THRESHOLD = 0.6; // < 60% on a topic = weak
const MAX_REFRESHERS_PER_ASSESSMENT = 2; // don't pile up steps

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  pct: number; // 0-100
}

export interface AssessmentAnalysis {
  overallScore: number; // 0-100
  passed: boolean;
  topicScores: TopicScore[];
  weakTopics: string[];
}

/** Analyze answers against the assessment, broken down by topicTag. */
export function analyzeAssessment(
  assessment: Assessment,
  answers: Record<string, number>
): AssessmentAnalysis {
  const total = assessment.questions.length;
  const correctCount = assessment.questions.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const overallScore = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  // Group by topicTag — questions with no tag fall under "General"
  const buckets: Record<string, { correct: number; total: number }> = {};
  for (const q of assessment.questions) {
    const topic = (q.topicTag ?? "General").trim() || "General";
    if (!buckets[topic]) buckets[topic] = { correct: 0, total: 0 };
    buckets[topic].total += 1;
    if (answers[q.id] === q.correctIndex) buckets[topic].correct += 1;
  }

  const topicScores: TopicScore[] = Object.entries(buckets).map(
    ([topic, { correct, total: t }]) => ({
      topic,
      correct,
      total: t,
      pct: t === 0 ? 0 : Math.round((correct / t) * 100),
    })
  );

  // Only flag topics that have >= 2 questions or where the user actively missed one
  const weakTopics = topicScores
    .filter(
      (ts) => ts.pct < WEAK_TOPIC_THRESHOLD * 100 && ts.total >= 1 && ts.correct < ts.total
    )
    .sort((a, b) => a.pct - b.pct)
    .map((ts) => ts.topic)
    .filter((t) => t !== "General"); // don't synth a refresher for ungrouped

  return {
    overallScore,
    passed: overallScore >= assessment.passingScore,
    topicScores,
    weakTopics,
  };
}

/* ─── Adaptive step builder ─── */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

/** Build a synthesized micro-refresher module step for a weak topic. */
function buildMicroRefresherModule(
  topic: string,
  insertOrder: number,
  uid: string
): StepItem {
  return {
    id: `adapt-mod-${slugify(topic)}-${uid}`,
    type: "module",
    title: `Quick Refresher: ${topic}`,
    description: `A 5-minute focused recap on ${topic}, built just for you based on your last attempt.`,
    order: insertOrder,
    skippable: false,
    status: "available",
    duration: "5 min",
    referenceId: `adapt-ref-${slugify(topic)}-${uid}`,
    learningFormat: "micro_refresher",
    isAdaptive: true,
    adaptiveReason: `Added to reinforce ${topic}`,
    topicTag: topic,
  };
}

/** Build a tiny 3-question check that follows the refresher. */
function buildMicroRefresherCheck(
  topic: string,
  insertOrder: number,
  uid: string
): StepItem {
  return {
    id: `adapt-asm-${slugify(topic)}-${uid}`,
    type: "assessment",
    title: `Quick Check: ${topic}`,
    description: `A short check to lock in ${topic}. No pressure — just a confidence boost.`,
    order: insertOrder,
    skippable: false,
    status: "locked",
    duration: "2 min",
    referenceId: `adapt-asm-ref-${slugify(topic)}-${uid}`,
    learningFormat: "micro",
    isAdaptive: true,
    adaptiveReason: `Quick check after the ${topic} refresher`,
    topicTag: topic,
  };
}

/**
 * Inject adaptive steps after the failed assessment, in order.
 * - For each weak topic (capped), add: refresher module + micro check.
 * - Avoid duplicates: skip topics that already have an adaptive step.
 * Returns updated steps array.
 */
export function injectAdaptiveSteps(
  steps: StepItem[],
  assessmentRefId: string,
  weakTopics: string[]
): { steps: StepItem[]; insertedCount: number } {
  if (!weakTopics.length) return { steps, insertedCount: 0 };

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const assessmentStep = sorted.find(
    (s) => s.type === "assessment" && (s.referenceId === assessmentRefId || s.id === assessmentRefId)
  );
  if (!assessmentStep) return { steps, insertedCount: 0 };

  // Filter topics that already have an adaptive step in this target
  const existingAdaptiveTopics = new Set(
    sorted.filter((s) => s.isAdaptive && s.topicTag).map((s) => s.topicTag!)
  );
  const topicsToAdd = weakTopics
    .filter((t) => !existingAdaptiveTopics.has(t))
    .slice(0, MAX_REFRESHERS_PER_ASSESSMENT);

  if (!topicsToAdd.length) return { steps, insertedCount: 0 };

  const uid = `${Date.now().toString(36).slice(-4)}`;
  const insertAfterOrder = assessmentStep.order;

  // Bump orders of everything after the assessment by (2 * topicsToAdd.length)
  const shift = topicsToAdd.length * 2;
  const shifted = sorted.map((s) =>
    s.order > insertAfterOrder ? { ...s, order: s.order + shift } : s
  );

  // Build new adaptive steps
  const adaptive: StepItem[] = [];
  topicsToAdd.forEach((topic, i) => {
    const baseOrder = insertAfterOrder + 1 + i * 2;
    adaptive.push(buildMicroRefresherModule(topic, baseOrder, `${uid}-${i}`));
    adaptive.push(buildMicroRefresherCheck(topic, baseOrder + 1, `${uid}-${i}`));
  });

  return {
    steps: [...shifted, ...adaptive].sort((a, b) => a.order - b.order),
    insertedCount: adaptive.length,
  };
}

/**
 * Find a completed module in the target whose title/topicTag matches a weak topic.
 * Used to "reopen" a previously-completed module so the learner can revisit.
 */
export function findReopenableModule(
  steps: StepItem[],
  weakTopic: string
): StepItem | null {
  const lc = weakTopic.toLowerCase();
  return (
    steps.find(
      (s) =>
        s.type === "module" &&
        (s.status === "completed" || s.status === "skipped") &&
        !s.isAdaptive &&
        ((s.topicTag && s.topicTag.toLowerCase() === lc) ||
          s.title.toLowerCase().includes(lc))
    ) ?? null
  );
}

/** Mark a previously-completed module as available again. */
export function reopenModule(steps: StepItem[], moduleStepId: string): StepItem[] {
  return steps.map((s) =>
    s.id === moduleStepId ? { ...s, status: "available" as const } : s
  );
}

/** Recompute progress percentage based on current step statuses. */
export function recomputeProgress(steps: StepItem[]): number {
  if (!steps.length) return 0;
  const done = steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  return Math.round((done / steps.length) * 100);
}
