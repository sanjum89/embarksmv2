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

  // 1. Direct match by module ID
  let mod = catalog.find((m) => m.id === moduleId);
  if (mod) return mod;

  // 2. Normalize common ID patterns (DB uses RAT-INTRO-LM-*, RAT-BR-LM-* but catalog may use RAT-INTRO-*, RAT-BR-*)
  const normalized = normalizeRathbonesId(moduleId);
  if (normalized !== moduleId) {
    mod = catalog.find((m) => m.id === normalized);
    if (mod) return mod;
  }

  // 3. Maybe moduleId is a step's referenceId — resolve via step.id in catalog
  for (const st of skillTargets) {
    for (const step of st.steps) {
      if (step.referenceId === moduleId && step.id !== moduleId) {
        mod = catalog.find((m) => m.id === step.id);
        if (mod) return mod;
      }
      if (step.id === moduleId && step.referenceId) {
        mod = catalog.find((m) => m.id === step.referenceId);
        if (mod) return mod;
      }
    }
  }

  // 4. Title-based match: find a step with this ID, then look for a catalog entry with the same title
  for (const st of skillTargets) {
    for (const step of st.steps) {
      if (step.id === moduleId || step.referenceId === moduleId) {
        const titleMatch = catalog.find(
          (m) => m.title.toLowerCase() === step.title.toLowerCase() && m.transcript && m.transcript.length > 50
        );
        if (titleMatch) return titleMatch;
      }
    }
  }

  // 5. Synthesize a module from the step's own metadata (last resort)
  for (const st of skillTargets) {
    for (const step of st.steps) {
      const match = step.id === moduleId || step.referenceId === moduleId;
      if (match && step.type === "module") {
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

/** Normalize Rathbones DB IDs to catalog IDs */
function normalizeRathbonesId(id: string): string {
  // RAT-INTRO-LM-001 → RAT-INTRO-001
  if (/^RAT-INTRO-LM-(\d+)$/.test(id)) {
    return id.replace("RAT-INTRO-LM-", "RAT-INTRO-");
  }
  // RAT-BR-LM-001 → RAT-BR-001
  if (/^RAT-BR-LM-(\d+)$/.test(id)) {
    return id.replace("RAT-BR-LM-", "RAT-BR-");
  }
  return id;
}

/**
 * Build a merged module catalog: account modules take priority, then mock catalog.
 */
export function buildCatalog(accountLearningModules?: LearningModule[]): LearningModule[] {
  if (!accountLearningModules || accountLearningModules.length === 0) {
    return mockLearningModules;
  }

  // Only keep account modules that have real content (non-empty transcript).
  // Empty account entries should NOT shadow richer mock catalog entries.
  const richAccountModules = accountLearningModules.filter(
    (m) => m.transcript && m.transcript.trim().length > 50
  );
  const accountIds = new Set(richAccountModules.map((m) => m.id));
  const fallback = mockLearningModules.filter((m) => !accountIds.has(m.id));
  return [...richAccountModules, ...fallback];
}
