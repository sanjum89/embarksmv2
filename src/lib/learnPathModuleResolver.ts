import type { LearningModule, SkillTarget } from "@/types/learning";
import { mockLearningModules } from "@/data/mock";
import type { AccountData } from "@/types/account";

/**
 * Resolve a module by ID, checking account modules first, then mock catalog.
 * Also handles the case where the ID is a skill-target step ID (e.g. "RAT-INTRO-001")
 * by looking up the step's referenceId and resolving that instead.
 */
export function resolveModule(
  moduleId: string,
  skillTargets: SkillTarget[],
  accountLearningModules?: LearningModule[]
): LearningModule | undefined {
  const catalog = buildCatalog(accountLearningModules);

  // 1. Direct match
  let mod = catalog.find((m) => m.id === moduleId);
  if (mod) return mod;

  // 2. Maybe moduleId is a step ID — resolve via referenceId
  for (const st of skillTargets) {
    for (const step of st.steps) {
      if (step.id === moduleId && step.referenceId) {
        mod = catalog.find((m) => m.id === step.referenceId);
        if (mod) return mod;
      }
    }
  }

  // 3. Synthesize a module from the step's own metadata
  for (const st of skillTargets) {
    for (const step of st.steps) {
      if (step.id === moduleId && step.type === "module") {
        return {
          id: moduleId,
          title: step.title,
          contentType: (step as any).contentType === "video" ? "video" : "document",
          contentUrl: "",
          transcript: step.description || `Content for ${step.title}.`,
          duration: step.duration ?? "5 min",
        } satisfies LearningModule;
      }
    }
  }

  return undefined;
}

/**
 * Build a merged module catalog: account modules take priority, then mock catalog.
 */
export function buildCatalog(accountLearningModules?: LearningModule[]): LearningModule[] {
  if (!accountLearningModules || accountLearningModules.length === 0) {
    return mockLearningModules;
  }
  const accountIds = new Set(accountLearningModules.map((m) => m.id));
  const fallback = mockLearningModules.filter((m) => !accountIds.has(m.id));
  return [...accountLearningModules, ...fallback];
}
