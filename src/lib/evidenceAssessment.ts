import { supabase } from "@/integrations/supabase/client";

export type EvidenceOutcome = "skip_remaining" | "reopen_for_refresh" | "pass_continue";

export interface EvidenceAssessment {
  score: number;
  outcome: EvidenceOutcome;
  feedback: string[];
  assessor: string;
  assessedAt: string;
  refresherModuleCode?: string;
  refresherModuleTitle?: string;
  skippedModuleCodes?: string[];
}

interface JourneyShape {
  cohortId: string;
  trackCode: string;
  /** Modules in the same track, in display order. */
  trackModules: { code: string; title: string; status: string }[];
}

/**
 * Generate a deterministic-feeling random assessment.
 * Score weighted toward 75-88. Outcome chosen with a coherent score band.
 */
export function generateEvidenceAssessment(
  qualityIndicators: string[],
): Omit<EvidenceAssessment, "refresherModuleCode" | "refresherModuleTitle" | "skippedModuleCodes"> {
  const r = Math.random();
  let score: number;
  if (r < 0.55) score = 78 + Math.floor(Math.random() * 11); // 78-88
  else if (r < 0.85) score = 70 + Math.floor(Math.random() * 8); // 70-77
  else if (r < 0.95) score = 89 + Math.floor(Math.random() * 8); // 89-96
  else score = 62 + Math.floor(Math.random() * 8); // 62-69

  let outcome: EvidenceOutcome;
  if (score >= 85) outcome = "skip_remaining";
  else if (score >= 75) outcome = Math.random() < 0.5 ? "skip_remaining" : "pass_continue";
  else outcome = "reopen_for_refresh";

  const indicators = qualityIndicators.length > 0
    ? qualityIndicators
    : [
        "Demonstrates clear grasp of the underlying concept.",
        "Grounds reasoning in a specific client situation.",
        "Identifies the regulatory and suitability angle.",
      ];

  const shuffled = [...indicators].sort(() => Math.random() - 0.5);
  const strengths = shuffled.slice(0, 2).map((s) => `Strong on: ${stripPeriod(s)}`);
  const growthSource = shuffled[2] ?? indicators[indicators.length - 1];
  const growth = `Could push further on: ${stripPeriod(growthSource)} — add more specificity next time.`;

  return {
    score,
    outcome,
    feedback: [...strengths, growth],
    assessor: "Manager (simulated)",
    assessedAt: new Date().toISOString(),
  };
}

function stripPeriod(s: string): string {
  return s.replace(/[.!?\s]+$/, "");
}

/**
 * Apply the outcome to the cohort's learner_progress rows.
 * - skip_remaining: marks all not-started chapters in OTHER modules in the same track as `skipped`
 *   with metadata.skip_reason.
 * - reopen_for_refresh: picks one previously-completed module in the same track and clears its
 *   first chapter back to not_started with metadata.reopen_reason.
 * - pass_continue: no structural change.
 */
export async function applyEvidenceOutcome(args: {
  accountId: string;
  employeeId: string;
  cohortId: string;
  moduleCode: string;
  outcome: EvidenceOutcome;
}): Promise<{ refresherModuleCode?: string; refresherModuleTitle?: string; skippedModuleCodes?: string[] }> {
  const { accountId, employeeId, cohortId, moduleCode, outcome } = args;

  // Resolve the track for this module
  const { data: modRow } = await supabase
    .from("catalog_modules")
    .select("learning_track_code, role_cohort_code")
    .eq("account_id", accountId)
    .eq("module_code", moduleCode)
    .maybeSingle();

  if (!modRow) return {};

  const { data: trackModules } = await supabase
    .from("catalog_modules")
    .select("module_code, module_title, display_order")
    .eq("account_id", accountId)
    .eq("learning_track_code", modRow.learning_track_code)
    .eq("role_cohort_code", modRow.role_cohort_code)
    .order("display_order", { ascending: true });

  const otherCodes = (trackModules ?? [])
    .map((m) => m.module_code)
    .filter((c) => c !== moduleCode);
  if (otherCodes.length === 0) return {};

  // Pull existing progress for those modules
  const { data: existingProgress } = await supabase
    .from("learner_progress")
    .select("id, module_code, chapter_code, status, metadata")
    .eq("account_id", accountId)
    .eq("employee_id", employeeId)
    .eq("cohort_id", cohortId)
    .in("module_code", otherCodes);

  if (outcome === "skip_remaining") {
    // Get all chapters of those modules
    const { data: chapters } = await supabase
      .from("catalog_chapters")
      .select("module_code, chapter_code")
      .eq("account_id", accountId)
      .in("module_code", otherCodes);

    const skippedCodes: string[] = [];
    const now = new Date().toISOString();
    for (const ch of chapters ?? []) {
      const existing = (existingProgress ?? []).find(
        (p) => p.module_code === ch.module_code && p.chapter_code === ch.chapter_code,
      );
      // Only act on not-yet-completed chapters
      if (existing && (existing.status === "completed" || existing.status === "skipped")) continue;
      const meta = {
        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
        skip_reason: "evidence_demonstrated",
      };
      if (existing?.id) {
        await supabase
          .from("learner_progress")
          .update({ status: "skipped", completed_at: now, metadata: meta })
          .eq("id", existing.id);
      } else {
        await supabase.from("learner_progress").insert([{
          account_id: accountId,
          employee_id: employeeId,
          cohort_id: cohortId,
          module_code: ch.module_code,
          chapter_code: ch.chapter_code,
          status: "skipped",
          completed_at: now,
          metadata: meta,
        }]);
      }
      if (!skippedCodes.includes(ch.module_code)) skippedCodes.push(ch.module_code);
    }
    return { skippedModuleCodes: skippedCodes };
  }

  if (outcome === "reopen_for_refresh") {
    // Find a completed module in same track (any whose every chapter is completed)
    const { data: chapters } = await supabase
      .from("catalog_chapters")
      .select("module_code, chapter_code, display_order")
      .eq("account_id", accountId)
      .in("module_code", otherCodes)
      .order("display_order", { ascending: true });

    const completedByModule = new Map<string, { code: string; chapters: { chapter_code: string; display_order: number }[] }>();
    for (const code of otherCodes) {
      const chs = (chapters ?? []).filter((c) => c.module_code === code);
      if (chs.length === 0) continue;
      const allDone = chs.every((c) => {
        const existing = (existingProgress ?? []).find(
          (p) => p.module_code === code && p.chapter_code === c.chapter_code,
        );
        return existing?.status === "completed";
      });
      if (allDone) completedByModule.set(code, { code, chapters: chs });
    }
    const candidates = Array.from(completedByModule.values());
    if (candidates.length === 0) return {};
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const firstCh = [...pick.chapters].sort((a, b) => a.display_order - b.display_order)[0];

    const existing = (existingProgress ?? []).find(
      (p) => p.module_code === pick.code && p.chapter_code === firstCh.chapter_code,
    );
    const meta = {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      reopen_reason: "manager_refresher",
    };
    if (existing?.id) {
      await supabase
        .from("learner_progress")
        .update({ status: "not_started", completed_at: null, metadata: meta })
        .eq("id", existing.id);
    }
    const title = (trackModules ?? []).find((m) => m.module_code === pick.code)?.module_title ?? pick.code;
    return { refresherModuleCode: pick.code, refresherModuleTitle: title };
  }

  return {};
}
