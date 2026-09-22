// Shared post-submit pipeline for any assessment in the cohort journey
// (synthetic diagnostic, midpoint quiz chapter, module-post blueprint, milestone
// blueprint). Owns:
//   • writing assessment_instances (status = "locked" when score < 80)
//   • invoking generate-micro-learning for every wrong question
//   • writing chapter_lock_events to re-open source chapters on score < 80
//
// Callers are responsible for any source-specific extras (e.g. the synthetic
// diagnostic ALSO writes per-chapter learner_progress rows so the lens UI
// reflects which chapters were skipped vs reopened).

import { supabase } from "@/integrations/supabase/client";
import { PASS_MARK } from "@/hooks/useLearnerJourney";

/** At most two gap modules per passed-with-gaps assessment. */
const MAX_GAP_MODULES = 2;

export type AssessmentSourceKind = "diagnostic" | "midpoint" | "module_post" | "milestone";

export interface WrongAnswerInput {
  question: string;
  learnerAnswer: string;
  correctAnswer: string;
  /** Source chapter(s) that taught this topic — used both for re-open and to
   * pass to generate-micro-learning so the produced micro links back. */
  chapterCodes?: string[];
  topicTag?: string;
}

export interface AssessmentSubmissionInput {
  accountId: string;
  cohortId: string;
  employeeId: string;
  /** Stable id for this assessment in the UI (chapter_code, blueprint_code, or
   * synthetic diagnostic key). Stored on the assessment_instances row for the
   * retry-lock guard. */
  assessmentId: string;
  sourceKind: AssessmentSourceKind;
  /** Parent module — required for assessment_instances + lock events. */
  moduleCode: string;
  /** chapter_code when this assessment lives on a single chapter (midpoint
   * quiz); blueprint_code on a module-post / milestone blueprint; omit for the
   * synthetic module-level diagnostic. */
  chapterCode?: string;
  blueprintCode?: string;
  passingScore: number;
  /** 0–100. */
  score: number;
  wrongAnswers: WrongAnswerInput[];
  /** Total questions in the assessment (for the lock-blocking check). When
   * < 80% the listed chapter codes are reopened AND the assessment is locked
   * until they're all completed. Defaults to deduped wrong-answer chapters. */
  lockUntilChapterCodes?: string[];
}

export interface AssessmentSubmissionResult {
  assessmentInstanceId: string | null;
  locked: boolean;
  microLearningRequested: boolean;
  reopenedChapterCodes: string[];
}

/**
 * Run the standard post-submit pipeline. Best-effort: individual steps log
 * warnings rather than throw, so a partial failure (e.g. AI quota) never
 * blocks the learner UI.
 */
export async function handleAssessmentSubmission(
  input: AssessmentSubmissionInput,
): Promise<AssessmentSubmissionResult> {
  const {
    accountId,
    cohortId,
    employeeId,
    assessmentId,
    sourceKind,
    moduleCode,
    chapterCode,
    blueprintCode,
    passingScore,
    score,
    wrongAnswers,
  } = input;

  // ── ONE pass mark for every assessment in the journey: the assessment's own
  // passing_score (80% for the Rathbones blueprints). Three outcome bands:
  //   • below pass          → reopen source chapters, lock retake, micro-learnings
  //   • pass with a gap     → no reopen, up to 2 "gap module" chapters
  //   • clean pass (100%)   → nothing injected
  const passMark = passingScore > 0 ? passingScore : PASS_MARK;
  const passed = score >= passMark;
  const hasWrong = wrongAnswers.length > 0;
  const gapPass = passed && hasWrong;

  // Decide what to reopen. Caller can override; otherwise dedupe wrong-answer
  // chapter codes.
  let reopenedChapterCodes = Array.from(
    new Set(
      (input.lockUntilChapterCodes ?? wrongAnswers.flatMap((w) => w.chapterCodes ?? []))
        .filter((c): c is string => typeof c === "string" && c.length > 0)
        // Don't re-open the chapter that hosts the assessment itself (a midpoint quiz).
        .filter((c) => c !== chapterCode),
    ),
  );

  // Fallback for assessments that carry no per-chapter mapping (the midpoint
  // quiz): reopen every completed chapter of this module taught before it.
  if (!passed && reopenedChapterCodes.length === 0) {
    try {
      const { data: done } = await supabase
        .from("learner_progress")
        .select("chapter_code, status")
        .eq("account_id", accountId)
        .eq("employee_id", employeeId)
        .eq("cohort_id", cohortId)
        .eq("module_code", moduleCode)
        .eq("status", "completed");
      reopenedChapterCodes = (done ?? [])
        .map((r) => r.chapter_code)
        .filter((c): c is string => !!c && c !== chapterCode && !c.startsWith("__"));
    } catch (e) {
      console.warn("[assessmentSubmission] reopen fallback failed", e);
    }
  }

  // 1. Write the assessment_instances row with the next attempt number.
  let instanceId: string | null = null;
  try {
    const dbKind =
      sourceKind === "milestone" ? "milestone" : "module_post";

    // Next attempt number for this assessment key.
    let attemptNumber = 1;
    try {
      const q = supabase
        .from("assessment_instances")
        .select("attempt_number")
        .eq("account_id", accountId)
        .eq("cohort_id", cohortId)
        .eq("employee_id", employeeId)
        .eq("module_code", moduleCode)
        .order("attempt_number", { ascending: false })
        .limit(1);
      const { data: prev } = blueprintCode
        ? await q.eq("blueprint_code", blueprintCode)
        : chapterCode
          ? await q.eq("chapter_code", chapterCode)
          : await q;
      attemptNumber = (prev?.[0]?.attempt_number ?? 0) + 1;
    } catch {
      /* keep 1 */
    }

    const status = passed ? "completed" : "locked";

    const { data: inserted, error: insertErr } = await supabase
      .from("assessment_instances")
      .insert([
        {
          account_id: accountId,
          cohort_id: cohortId,
          employee_id: employeeId,
          blueprint_code: blueprintCode ?? null,
          module_code: moduleCode,
          chapter_code: chapterCode ?? null,
          kind: dbKind as any,
          attempt_number: attemptNumber,
          status,
          score,
          completed_at: new Date().toISOString(),
          locks_retake_until_chapters: passed ? ([] as any) : (reopenedChapterCodes as any),
          metadata: { assessment_id: assessmentId, source_kind: sourceKind } as any,
        },
      ])
      .select("id")
      .maybeSingle();
    if (insertErr) throw insertErr;
    instanceId = inserted?.id ?? null;
  } catch (e) {
    console.warn("[assessmentSubmission] assessment_instances insert failed", e);
  }

  // 2. Remediation: micro-learnings on a fail, capped gap modules on a gap pass.
  let microLearningRequested = false;
  if (hasWrong) {
    microLearningRequested = true;
    supabase.functions
      .invoke("embarksmv2-generate-micro-learning", {
        body: {
          accountId,
          cohortId,
          employeeId,
          sourceAssessmentId: instanceId,
          moduleCode,
          kind: gapPass ? "gap_module" : "micro_learning",
          maxItems: gapPass ? MAX_GAP_MODULES : undefined,
          wrongAnswers: wrongAnswers.map((w) => ({
            question: w.question,
            learnerAnswer: w.learnerAnswer,
            correctAnswer: w.correctAnswer,
            chapterCodes: w.chapterCodes ?? [],
            topicTag: w.topicTag,
          })),
        },
      })
      .catch((e) => console.warn("[assessmentSubmission] generate-micro-learning failed", e));
  }

  // 3. Re-open the source chapters — only when the learner did NOT pass.
  if (!passed && reopenedChapterCodes.length > 0) {
    try {
      const rows = reopenedChapterCodes.map((chCode) => ({
        account_id: accountId,
        cohort_id: cohortId,
        employee_id: employeeId,
        module_code: moduleCode,
        chapter_code: chCode,
        reason: `reopened_after_${sourceKind}_fail`,
        triggered_by_assessment_id: instanceId,
      }));
      const { error: lockErr } = await supabase.from("chapter_lock_events").insert(rows as any);
      if (lockErr) throw lockErr;

      // Reset learner_progress for the reopened chapters so the journey shows
      // them as "in_progress" again instead of completed.
      for (const chCode of reopenedChapterCodes) {
        const { data: existing } = await supabase
          .from("learner_progress")
          .select("id")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("cohort_id", cohortId)
          .eq("module_code", moduleCode)
          .eq("chapter_code", chCode)
          .maybeSingle();
        if (existing?.id) {
          await supabase
            .from("learner_progress")
            .update({ status: "in_progress", completed_at: null })
            .eq("id", existing.id);
        }
      }
    } catch (e) {
      console.warn("[assessmentSubmission] chapter_lock_events insert failed", e);
    }
  }

  return {
    assessmentInstanceId: instanceId,
    locked: !passed,
    microLearningRequested,
    reopenedChapterCodes: passed ? [] : reopenedChapterCodes,
  };
}

