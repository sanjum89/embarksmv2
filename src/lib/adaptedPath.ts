import type { LearnerJourney, JourneyChapter, JourneyModule } from "@/hooks/useLearnerJourney";
import type { AdaptationType } from "@/lib/embarkAdaptation";

export type AssessmentKind = "baseline" | "diagnostic" | "chapter" | "adhoc" | "final" | "roleplay";

function isAssessmentLike(c: JourneyChapter): boolean {
  const t = (c.contentType || "").toLowerCase();
  return t.includes("assessment") || t.includes("quiz") || t.includes("check") || t.includes("diag") || t.includes("role");
}

export function isRolePlay(c: JourneyChapter): boolean {
  return (c.contentType || "").toLowerCase().includes("role");
}

/**
 * Infer the assessment "flavor" from chapter metadata and position in module.
 * - first chapter & assessment-like → baseline
 * - last chapter & assessment-like → final
 * - middle → chapter check
 * - explicit content_type wins where possible
 */
export function classifyAssessment(c: JourneyChapter, m: JourneyModule): AssessmentKind | null {
  if (!isAssessmentLike(c)) return null;
  const t = (c.contentType || "").toLowerCase();
  if (t.includes("role")) return "roleplay";
  if (t.includes("diag")) return "diagnostic";
  if (t.includes("baseline")) return "baseline";
  if (t.includes("final") || t.includes("summative") || t.includes("mock")) return "final";
  if (t.includes("adhoc")) return "adhoc";
  const sorted = [...m.chapters].sort((a, b) => a.displayOrder - b.displayOrder);
  const idx = sorted.findIndex((x) => x.code === c.code);
  if (idx === 0) return "baseline";
  if (idx === sorted.length - 1) return "final";
  return "chapter";
}

export function assessmentKindLabel(k: AssessmentKind): string {
  switch (k) {
    case "baseline": return "Baseline diagnostic";
    case "diagnostic": return "Quick diagnostic";
    case "chapter": return "Chapter check";
    case "adhoc": return "Adhoc check";
    case "final": return "Final assessment";
    case "roleplay": return "Role play";
  }
}

export interface AdaptedSummary {
  condensedModules: number;
  skippedModules: number;
  diagnosticOnlyModules: number;
  evidenceModules: number;
  fullModules: number;
  addedRolePlays: number;
  assessmentsByKind: Record<AssessmentKind, number>;
  totalModules: number;
  sentence: string;
}

export function summariseAdaptations(journey: LearnerJourney): AdaptedSummary {
  const allModules = journey.tracks.flatMap((t) => t.modules);
  const counts = { full_module: 0, microlearning: 0, diagnostic_only: 0, evidence_required: 0, skip_after_validation: 0 } as Record<AdaptationType, number>;
  let addedRolePlays = 0;
  const assessmentsByKind: Record<AssessmentKind, number> = {
    baseline: 0, diagnostic: 0, chapter: 0, adhoc: 0, final: 0, roleplay: 0,
  };

  allModules.forEach((m) => {
    const t = m.adaptation?.adaptationType ?? "full_module";
    counts[t]++;
    m.chapters.forEach((c) => {
      const kind = classifyAssessment(c, m);
      if (kind) assessmentsByKind[kind]++;
      if (kind === "roleplay") addedRolePlays++;
    });
  });

  const condensedModules = counts.microlearning;
  const skippedModules = counts.skip_after_validation;
  const diagnosticOnlyModules = counts.diagnostic_only;
  const evidenceModules = counts.evidence_required;
  const fullModules = counts.full_module;

  const bits: string[] = [];
  if (condensedModules > 0) bits.push(`${condensedModules} module${condensedModules > 1 ? "s" : ""} condensed`);
  if (skippedModules > 0) bits.push(`${skippedModules} already covered`);
  if (diagnosticOnlyModules > 0) bits.push(`${diagnosticOnlyModules} diagnostic-only`);
  if (evidenceModules > 0) bits.push(`${evidenceModules} evidence-based`);
  if (addedRolePlays > 0) bits.push(`${addedRolePlays} role play${addedRolePlays > 1 ? "s" : ""} added`);

  const assessTotal = Object.values(assessmentsByKind).reduce((a, b) => a + b, 0);
  const tail = assessTotal > 0 ? ` ${assessTotal} checkpoint${assessTotal > 1 ? "s" : ""} along the way.` : "";

  const sentence = bits.length === 0
    ? `Your path follows the cohort standard — ${fullModules} module${fullModules === 1 ? "" : "s"}, no personalisations yet.${tail}`
    : `Your path is personalised: ${bits.join(" · ")}.${tail}`;

  return {
    condensedModules, skippedModules, diagnosticOnlyModules, evidenceModules, fullModules,
    addedRolePlays, assessmentsByKind, totalModules: allModules.length, sentence,
  };
}

export function assessmentKindToneClass(k: AssessmentKind): string {
  // Semantic tokens only.
  switch (k) {
    case "baseline":   return "border-primary/30 text-primary";
    case "diagnostic": return "border-accent/40 text-accent-foreground";
    case "chapter":    return "border-border text-muted-foreground";
    case "adhoc":      return "border-border text-muted-foreground";
    case "final":      return "border-destructive/30 text-destructive";
    case "roleplay":   return "border-primary/30 text-primary";
  }
}
