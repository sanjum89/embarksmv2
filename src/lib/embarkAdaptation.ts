/**
 * Persona-driven module adaptation: backend type ↔ learner-facing label,
 * with Clara-safe phrasing rules for any reason text.
 *
 * The five backend values are stored in `persona_module_adaptations.adaptation_type`.
 * UI must always show the friendly label, never the raw backend value.
 */

export type AdaptationType =
  | "full_module"
  | "microlearning"
  | "diagnostic_only"
  | "evidence_required"
  | "skip_after_validation";

export interface ModuleAdaptation {
  adaptationType: AdaptationType;
  reason: string;
  visibleToLearner: boolean;
  managerNote?: string;
  /** Resolved competency context for the popover */
  competencyName?: string;
  currentLevel?: number;
  requiredLevel?: number;
  validationNeeded?: boolean;
  riskCritical?: boolean;
}

/** Single source of truth for learner-facing badge labels. */
export function formatAdaptationLabel(t: AdaptationType): string {
  switch (t) {
    case "full_module":
      return "Full module";
    case "microlearning":
      return "Condensed module";
    case "diagnostic_only":
      return "Quick diagnostic";
    case "evidence_required":
      return "Evidence task";
    case "skip_after_validation":
      return "Already covered";
  }
}

/** One-paragraph plain-English explanation of each delivery mode, written for the learner. */
export function adaptationExplanation(t: AdaptationType): string {
  switch (t) {
    case "full_module":
      return "Read every chapter end-to-end. Recommended when this is new territory for you.";
    case "microlearning":
      return "A shorter pass through the same material. We've trimmed sections your profile already evidences, so you only see what's likely new.";
    case "diagnostic_only":
      return "Answer 3 quick questions. Each correct answer skips one of the first foundation chapters — the rest of the module stays as normal reading.";
    case "evidence_required":
      return "Submit a short piece of work up front. A successful evidence task covers the first few foundation chapters; the remaining chapters still need to be read.";
    case "skip_after_validation":
      return "Your profile already evidences this. We're not adding it to your journey, but you can revisit it anytime from the catalog.";
  }
}

/** Tone class for the badge. */
export function adaptationBadgeTone(t: AdaptationType):
  | "neutral"
  | "condensed"
  | "diagnostic"
  | "evidence"
  | "covered" {
  switch (t) {
    case "full_module":
      return "neutral";
    case "microlearning":
      return "condensed";
    case "diagnostic_only":
      return "diagnostic";
    case "evidence_required":
      return "evidence";
    case "skip_after_validation":
      return "covered";
  }
}

const FORBIDDEN = ["skip", "skipped", "bypass", "bypassed", "removed", "you don't need", "you do not need"];

/**
 * Returns true if a string contains any phrasing we don't want shown to learners.
 * Used by tests + as a guardrail when injecting reason text into AI prompts.
 */
export function containsForbiddenPhrasing(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN.some((p) => lower.includes(p));
}

/**
 * Rewrites any forbidden phrasing into Clara-safe equivalents.
 * Defensive only — generated reasons should already be safe.
 */
export function sanitizeReason(text: string): string {
  let out = text;
  out = out.replace(/\bskipped\b/gi, "already covered");
  out = out.replace(/\bskip\b/gi, "treat as already covered");
  out = out.replace(/\bbypassed\b/gi, "already covered");
  out = out.replace(/\bbypass\b/gi, "treat as already covered");
  out = out.replace(/\bremoved\b/gi, "not required in this pathway view");
  out = out.replace(/you don'?t need (this|it)/gi, "your profile already evidences this");
  out = out.replace(/you do not need (this|it)/gi, "your profile already evidences this");
  return out;
}
