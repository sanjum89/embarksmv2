/**
 * Per-employee manager signals derived from real cohort tables.
 * Returns a `LearnerOverlay` shape so the existing manager surfaces
 * (Roster, Heatmap, Sankey, Drawer, Action Centre, AI Changes Feed)
 * keep working unchanged.
 *
 * Falls back to `null` when the employee has no rows in `learner_progress`
 * — callers should then drop back to the legacy `getDemoOverlay()` path.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  LearnerOverlay,
  LearnerStatus,
  ModuleCellOverlay,
  AiPathChange,
} from "@/data/managerDemoOverlay";
import { getRathbonesNarrative } from "@/lib/rathbonesNarrative";

interface LiveModule {
  module_code: string;
  module_title: string;
  display_order?: number | null;
}

interface DbBundle {
  progress: Array<{ module_code: string; chapter_code: string | null; status: string; completed_at: string | null }>;
  assessments: Array<{ id: string; module_code: string | null; score: number | null; attempt_number: number; completed_at: string | null; metadata: any; weak_topic_tags: string[] }>;
  locks: Array<{ module_code: string; chapter_code: string; reason: string | null; unlocked_at: string | null; created_at: string }>;
  micros: Array<{ id: string; failed_question: string; status: string; created_at: string }>;
  analytics: { last_activity_at: string | null; total_assessment_attempts: number; total_retakes: number; total_micro_learnings: number } | null;
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function humanRelative(iso: string | null | undefined): string | undefined {
  const d = daysSince(iso);
  if (d == null) return undefined;
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export async function loadEmployeeSignals(
  accountId: string,
  cohortId: string,
  employeeId: string,
  modules: LiveModule[],
): Promise<DbBundle> {
  const [progress, assessments, locks, micros, analytics] = await Promise.all([
    supabase
      .from("learner_progress")
      .select("module_code, chapter_code, status, completed_at")
      .eq("account_id", accountId)
      .eq("cohort_id", cohortId)
      .eq("employee_id", employeeId),
    supabase
      .from("assessment_instances")
      .select("id, module_code, score, attempt_number, completed_at, metadata, weak_topic_tags")
      .eq("account_id", accountId)
      .eq("cohort_id", cohortId)
      .eq("employee_id", employeeId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("chapter_lock_events")
      .select("module_code, chapter_code, reason, unlocked_at, created_at")
      .eq("account_id", accountId)
      .eq("cohort_id", cohortId)
      .eq("employee_id", employeeId),
    supabase
      .from("micro_learnings")
      .select("id, failed_question, status, created_at")
      .eq("account_id", accountId)
      .eq("cohort_id", cohortId)
      .eq("employee_id", employeeId),
    supabase
      .from("learner_analytics")
      .select("last_activity_at, total_assessment_attempts, total_retakes, total_micro_learnings")
      .eq("account_id", accountId)
      .eq("cohort_id", cohortId)
      .eq("employee_id", employeeId)
      .maybeSingle(),
  ]);

  return {
    progress: (progress.data ?? []) as any,
    assessments: (assessments.data ?? []) as any,
    locks: (locks.data ?? []) as any,
    micros: (micros.data ?? []) as any,
    analytics: (analytics.data ?? null) as any,
  };
}

/** Aggregate progress per module from raw learner_progress rows. */
function buildCellsFromProgress(
  modules: LiveModule[],
  bundle: DbBundle,
  chaptersByModule: Record<string, number>,
): ModuleCellOverlay[] {
  const progressByModule: Record<string, { completed: number; in_progress: number; lastDone: string | null }> = {};
  for (const p of bundle.progress) {
    const m = (progressByModule[p.module_code] ??= { completed: 0, in_progress: 0, lastDone: null });
    if (p.status === "completed") {
      m.completed += 1;
      if (p.completed_at && (!m.lastDone || p.completed_at > m.lastDone)) m.lastDone = p.completed_at;
    } else if (p.status === "in_progress") {
      m.in_progress += 1;
    }
  }
  const scoreByModule: Record<string, number> = {};
  for (const a of bundle.assessments) {
    if (!a.module_code || a.score == null) continue;
    // Keep the most recent attempt (assessments are already sorted desc).
    if (!(a.module_code in scoreByModule)) scoreByModule[a.module_code] = Number(a.score);
  }
  return modules.map((m) => {
    const agg = progressByModule[m.module_code];
    const total = chaptersByModule[m.module_code] ?? 1;
    let status: ModuleCellOverlay["status"] = "not_started";
    if (agg) {
      if (agg.completed >= total) status = "completed";
      else if (agg.completed > 0 || agg.in_progress > 0) status = "in_progress";
    }
    return {
      module_code: m.module_code,
      status,
      score: scoreByModule[m.module_code],
      last_activity: humanRelative(agg?.lastDone),
    };
  });
}

/** Derive status per the plan's rules: at_risk > needs_check_in > rising_star > on_track. */
function deriveStatus(bundle: DbBundle, cells: ModuleCellOverlay[]): LearnerStatus {
  const failed = bundle.assessments.filter((a) => a.score != null && Number(a.score) < 70).length;
  const idleDays = daysSince(bundle.analytics?.last_activity_at) ?? 99;
  const pendingMicros = bundle.micros.filter((m) => m.status === "pending").length;
  if (failed >= 2 || idleDays > 7) return "at_risk";
  if (pendingMicros >= 1 && idleDays <= 7) return "needs_check_in";
  const completed = cells.filter((c) => c.status === "completed").length;
  if (completed >= 6 && failed === 0 && pendingMicros === 0) return "rising_star";
  return "on_track";
}

function buildTimeline(bundle: DbBundle): { date: string; label: string }[] {
  const items: { date: string; label: string; ts: number }[] = [];
  for (const a of bundle.assessments.slice(0, 6)) {
    if (!a.completed_at) continue;
    const scope = (a.metadata?.scope as string) ?? "module_post";
    items.push({
      date: a.completed_at.slice(0, 10),
      label: `Assessment · ${a.module_code ?? ""} · ${a.score ?? "?"}% (${scope}, attempt ${a.attempt_number})`,
      ts: new Date(a.completed_at).getTime(),
    });
  }
  for (const l of bundle.locks.slice(0, 6)) {
    items.push({
      date: l.created_at.slice(0, 10),
      label: `Chapter re-opened · ${l.chapter_code} (${l.reason ?? "remediation"})`,
      ts: new Date(l.created_at).getTime(),
    });
  }
  for (const m of bundle.micros.slice(0, 4)) {
    items.push({
      date: m.created_at.slice(0, 10),
      label: `Micro-learning · ${m.failed_question.slice(0, 60)} · ${m.status}`,
      ts: new Date(m.created_at).getTime(),
    });
  }
  return items.sort((a, b) => b.ts - a.ts).slice(0, 10).map(({ date, label }) => ({ date, label }));
}

function buildPathChanges(bundle: DbBundle, modulesByCode: Map<string, string>, employeeId: string): AiPathChange[] {
  const out: AiPathChange[] = [];
  // Each pending micro_learning becomes a "microlearning" path change.
  const byModule = new Map<string, number>();
  for (const m of bundle.micros) {
    // Try to attribute the micro to a module via the originating assessment.
    const assess = bundle.assessments.find((a) => a.id === (m as any).source_assessment_id);
    const moduleCode = assess?.module_code ?? "unknown";
    byModule.set(moduleCode, (byModule.get(moduleCode) ?? 0) + 1);
  }
  let i = 0;
  for (const [moduleCode, count] of byModule.entries()) {
    out.push({
      id: `derived-micro-${employeeId}-${i++}`,
      employeeId,
      module_code: moduleCode,
      module_title: modulesByCode.get(moduleCode) ?? moduleCode,
      kind: "microlearning",
      reason: `${count} micro-learning${count > 1 ? "s" : ""} generated from the missed slice of the assessment.`,
      evidence: [`Pending micros: ${count}`],
      confidence: "high",
      risk: "low",
      needs_approval: false,
      created_at: "recently",
    });
  }
  // Reopened chapters become "emphasis" path changes grouped by module.
  const reopensByModule = new Map<string, number>();
  for (const l of bundle.locks) {
    reopensByModule.set(l.module_code, (reopensByModule.get(l.module_code) ?? 0) + 1);
  }
  for (const [moduleCode, count] of reopensByModule.entries()) {
    out.push({
      id: `derived-reopen-${employeeId}-${i++}`,
      employeeId,
      module_code: moduleCode,
      module_title: modulesByCode.get(moduleCode) ?? moduleCode,
      kind: "emphasis",
      reason: `${count} chapter${count > 1 ? "s" : ""} re-opened after midpoint assessment fell below the pass threshold.`,
      evidence: [`Re-opened chapters: ${count}`],
      confidence: "high",
      risk: "medium",
      needs_approval: false,
      created_at: "recently",
    });
  }
  return out;
}

/** Build a complete LearnerOverlay from DB bundle + narrative. Returns null if no DB rows. */
export function overlayFromSignals(
  employeeId: string,
  bundle: DbBundle,
  modules: LiveModule[],
  chaptersByModule: Record<string, number>,
): LearnerOverlay | null {
  if (!bundle.progress.length && !bundle.assessments.length) return null;

  const cells = buildCellsFromProgress(modules, bundle, chaptersByModule);
  const narrative = getRathbonesNarrative(employeeId);
  const derivedStatus = deriveStatus(bundle, cells);
  const status: LearnerStatus = narrative?.statusOverride ?? derivedStatus;

  const modulesByCode = new Map(modules.map((m) => [m.module_code, m.module_title]));
  const pathChanges = buildPathChanges(bundle, modulesByCode, employeeId);
  const timeline = buildTimeline(bundle);

  const completed = cells.filter((c) => c.status === "completed").length;
  const total = cells.length;
  const headline = narrative?.headline ?? `${completed}/${total} modules complete · ${status.replace(/_/g, " ")}.`;
  const story =
    narrative?.story ??
    `${completed} of ${total} modules complete. ${bundle.micros.filter((m) => m.status === "pending").length} pending micro-learnings. Last active ${humanRelative(bundle.analytics?.last_activity_at) ?? "recently"}.`;

  return {
    employeeId,
    status,
    headline,
    story,
    cells,
    pathChanges,
    actions: [],
    cpd: { employeeId, hours_logged: 0, hours_required: 35, status: "on_track", evidence_count: 0 },
    reflections: [],
    rolePlays: [],
    notes_seed: [],
    timeline,
  };
}
