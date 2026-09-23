import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ModuleAdaptation } from "@/lib/embarkAdaptation";
import { diagnosticReopens } from "@/store/useDiagnosticReopens";

export type ChapterStatus = "not_started" | "in_progress" | "completed" | "locked";
export type ModuleStatus = "completed" | "in_progress" | "up_next" | "locked";

/** Single pass mark used everywhere an assessment has no explicit blueprint. */
export const PASS_MARK = 80;


export interface JourneyChapter {
  code: string;
  title: string;
  contentType: string;
  minutes: number;
  status: ChapterStatus;
  displayOrder: number;
  /** Latest assessment attempt for this chapter, if any. */
  assessmentScore?: number;
  assessmentPassed?: boolean;
  assessmentPassingScore?: number;
  /** How many attempts the learner has made at this assessment. */
  attemptCount?: number;
  /** True when a retake is blocked until the reopened chapters are redone. */
  retakeLocked?: boolean;
  retakeBlockedChapters?: string[];
  /** Why a module assessment can't be submitted yet. */
  gateReason?: string;
  /** Per-learner remediation chapter injected beneath its source assessment. */
  remediationKind?: "micro_learning" | "gap_module";
  microLearningId?: string;
  /** Raw catalog metadata for this chapter (e.g. micro_learning_for). */
  metadata?: Record<string, any> | null;
}



export interface JourneyModule {
  code: string;
  title: string;
  summary?: string;
  trackCode: string;
  isCoreRequired: boolean;
  isStretch: boolean;
  prerequisiteCodes: string[];
  prerequisiteTitle?: string;
  chapters: JourneyChapter[];
  completedChapters: number;
  totalChapters: number;
  pct: number;
  status: ModuleStatus;
  displayOrder: number;
  adaptation?: ModuleAdaptation;
}

export interface JourneyTrack {
  code: string;
  name: string;
  displayOrder: number;
  modules: JourneyModule[];
  completedChapters: number;
  totalChapters: number;
  completedModules: number;
  totalModules: number;
  pct: number;
}

export interface JourneyCohort {
  id: string;
  code: string;
  title: string;
  roleCohortCode: string;
  dueDate?: string | null;
  startDate?: string | null;
  completedModules: number;
  totalModules: number;
  completedChapters: number;
  totalChapters: number;
  overallPct: number;
}

export interface LearnerJourney {
  cohort: JourneyCohort;
  tracks: JourneyTrack[];
}

interface State {
  journey: LearnerJourney | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLearnerJourney(
  accountId: string | null | undefined,
  employeeId: string | null | undefined
): State {
  const [refreshTick, setRefreshTick] = useState(0);
  // Initialize isLoading=true when both ids are present so first-render
  // consumers (e.g. EmbarkChat greeting) don't race ahead of the fetch.
  const [state, setState] = useState<Omit<State, "refresh">>(() => ({
    journey: null,
    isLoading: Boolean(accountId && employeeId),
    error: null,
  }));


  // Stable key so we don't refetch on object identity churn
  const key = `${accountId ?? ""}::${employeeId ?? ""}::${refreshTick}`;

  useEffect(() => {
    if (!accountId || !employeeId) {
      setState({ journey: null, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    (async () => {
      try {
        // 1. Active enrollment for this employee
        const { data: enrollments, error: enErr } = await supabase
          .from("cohort_enrollments")
          .select("cohort_id, status")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("status", "active")
          .limit(1);
        if (enErr) throw enErr;
        const cohortId = enrollments?.[0]?.cohort_id;
        if (!cohortId) {
          if (!cancelled) setState({ journey: null, isLoading: false, error: null });
          return;
        }

        // 2. Cohort row
        const { data: cohortRow, error: cohortErr } = await supabase
          .from("cohorts")
          .select("id, cohort_code, cohort_title, role_cohort_code, due_date, start_date")
          .eq("id", cohortId)
          .maybeSingle();
        if (cohortErr) throw cohortErr;
        if (!cohortRow) {
          if (!cancelled) setState({ journey: null, isLoading: false, error: null });
          return;
        }

        // 3. Tracks for the account
        const { data: tracks, error: tErr } = await supabase
          .from("learning_tracks")
          .select("code, name, display_order")
          .eq("account_id", accountId)
          .order("display_order", { ascending: true });
        if (tErr) throw tErr;

        // 4. Modules for this cohort's role
        const { data: modules, error: mErr } = await supabase
          .from("catalog_modules")
          .select(
            "module_code, module_title, module_summary, learning_track_code, is_core_required, is_stretch_module, prerequisite_module_codes, display_order"
          )
          .eq("account_id", accountId)
          .eq("role_cohort_code", cohortRow.role_cohort_code)
          .order("display_order", { ascending: true });
        if (mErr) throw mErr;

        const moduleCodes = (modules ?? []).map((m) => m.module_code);

        // 5. Chapters for those modules
        const { data: chapters, error: chErr } = moduleCodes.length
          ? await supabase
              .from("catalog_chapters")
              .select(
                "chapter_code, module_code, chapter_title, content_type, estimated_time_minutes, display_order, metadata"
              )
              .eq("account_id", accountId)
              .in("module_code", moduleCodes)
              .order("display_order", { ascending: true })
          : { data: [], error: null };
        if (chErr) throw chErr;

        // 6. Learner progress
        const { data: progress, error: prErr } = await supabase
          .from("learner_progress")
          .select("module_code, chapter_code, status, metadata")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("cohort_id", cohortId);
        if (prErr) throw prErr;

        // Hydrate diagnostic-reopens store from any persisted __diag rows so the
        // lens UI survives page reloads.
        (progress ?? []).forEach((p) => {
          if (p.chapter_code !== "__diag") return;
          const r = (p.metadata as any)?.diagnostic_result;
          if (!r) return;
          diagnosticReopens.recordSubmission(
            p.module_code,
            Array.isArray(r.wrong_chapters) ? r.wrong_chapters : [],
            Number(r.total) || 0,
            Number(r.correct) || 0,
          );
        });

        // 7. Open lock events (unlocked_at IS NULL = still locked)
        const { data: lockEvents, error: lkErr } = await supabase
          .from("chapter_lock_events")
          .select("module_code, chapter_code, unlocked_at, reason")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("cohort_id", cohortId)
          .is("unlocked_at", null);
        if (lkErr) throw lkErr;

        // 7b. Persona for this employee + adaptations for that persona
        const { data: personaRow } = await supabase
          .from("employee_persona_assignments")
          .select("persona_code")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .maybeSingle();
        const personaCode = personaRow?.persona_code ?? null;

        let adaptationByModule = new Map<string, ModuleAdaptation>();
        if (personaCode && moduleCodes.length) {
          const [{ data: adapts }, { data: tags }, { data: reqs }, { data: profiles }, { data: comps }] = await Promise.all([
            supabase.from("persona_module_adaptations").select("module_code, adaptation_type, reason, visible_to_learner, manager_note")
              .eq("account_id", accountId).eq("persona_code", personaCode).in("module_code", moduleCodes),
            supabase.from("module_competency_tags").select("module_code, primary_competency_id, risk_critical")
              .eq("account_id", accountId).in("module_code", moduleCodes),
            supabase.from("role_competency_requirements").select("competency_id, required_level")
              .eq("account_id", accountId).eq("role_cohort_code", cohortRow.role_cohort_code),
            supabase.from("persona_competency_profiles").select("competency_id, current_level, validation_needed")
              .eq("account_id", accountId).eq("persona_code", personaCode),
            supabase.from("competency_catalog").select("competency_id, competency_name").eq("account_id", accountId),
          ]);
          const tagBy = new Map<string, { primary_competency_id: string; risk_critical: boolean }>();
          (tags ?? []).forEach((t) => tagBy.set(t.module_code, { primary_competency_id: t.primary_competency_id, risk_critical: !!t.risk_critical }));
          const reqBy = new Map<string, number>();
          (reqs ?? []).forEach((r) => reqBy.set(r.competency_id, r.required_level));
          const profBy = new Map<string, { current_level: number; validation_needed: boolean }>();
          (profiles ?? []).forEach((p) => profBy.set(p.competency_id, { current_level: p.current_level, validation_needed: !!p.validation_needed }));
          const nameBy = new Map<string, string>();
          (comps ?? []).forEach((c) => nameBy.set(c.competency_id, c.competency_name));
          (adapts ?? []).forEach((a) => {
            const tag = tagBy.get(a.module_code);
            const compId = tag?.primary_competency_id;
            const prof = compId ? profBy.get(compId) : undefined;
            adaptationByModule.set(a.module_code, {
              adaptationType: a.adaptation_type as ModuleAdaptation["adaptationType"],
              reason: a.reason ?? "",
              visibleToLearner: a.visible_to_learner !== false,
              managerNote: a.manager_note ?? undefined,
              competencyName: compId ? nameBy.get(compId) : undefined,
              currentLevel: prof?.current_level,
              requiredLevel: compId ? reqBy.get(compId) : undefined,
              validationNeeded: prof?.validation_needed,
              riskCritical: tag?.risk_critical,
            });
          });
        }

        const progressMap = new Map<string, string>();
        (progress ?? []).forEach((p) => {
          const k = `${p.module_code}::${p.chapter_code ?? ""}`;
          progressMap.set(k, p.status);
        });
        // Two flavours of open lock event: a hard lock (chapter not yet
        // available) and a "reopened after a failed check" event, which makes
        // the chapter available again so the learner can redo it.
        const lockSet = new Set<string>();
        const reopenSet = new Set<string>();
        (lockEvents ?? []).forEach((l) => {
          const key = `${l.module_code}::${l.chapter_code ?? ""}`;
          if ((l.reason ?? "").startsWith("reopened")) reopenSet.add(key);
          else lockSet.add(key);
        });

        // 7c. Latest assessment attempt — keyed by chapter_code OR blueprint_code
        // (blueprint rows come from catalog_assessment_blueprints and are
        // injected as synthetic chapter rows further down).
        const assessmentByKey = new Map<
          string,
          {
            score: number;
            passed: boolean;
            passingScore: number;
            locked: boolean;
            attemptCount: number;
            retakeBlockedChapters: string[];
          }
        >();
        // Module-post + milestone blueprints, used to inject synthetic
        // assessment "chapters" into the journey.
        let blueprintRows: Array<{
          blueprint_code: string;
          module_code: string;
          scope: string;
          assessment_title: string;
          passing_score: number;
        }> = [];
        // Per-learner remediation items (micro-learnings / gap modules).
        let microRows: Array<{
          id: string;
          module_code: string | null;
          topic_tag: string | null;
          status: string;
          kind: string;
          teaching_content_outline: string | null;
          source_assessment_id: string | null;
          created_at: string;
        }> = [];
        // assessment_instances.id → the key (blueprint/chapter code) it belongs to
        const instanceIdToKey = new Map<string, string>();
        if (moduleCodes.length) {
          const [{ data: instances }, { data: chapterBlueprints }, { data: moduleBlueprints }, { data: micros }] =
            await Promise.all([
              supabase
                .from("assessment_instances")
                .select(
                  "id, chapter_code, blueprint_code, module_code, score, attempt_number, completed_at, started_at, status, metadata, locks_retake_until_chapters",
                )
                .eq("account_id", accountId)
                .eq("employee_id", employeeId)
                .eq("cohort_id", cohortId)
                .in("module_code", moduleCodes),
              supabase
                .from("catalog_assessment_blueprints")
                .select("chapter_code, passing_score")
                .eq("account_id", accountId)
                .in("module_code", moduleCodes)
                .not("chapter_code", "is", null),
              supabase
                .from("catalog_assessment_blueprints")
                .select("blueprint_code, module_code, scope, assessment_title, passing_score")
                .eq("account_id", accountId)
                .in("module_code", moduleCodes)
                .in("scope", ["module_post", "milestone"] as any),
              supabase
                .from("micro_learnings")
                .select(
                  "id, module_code, topic_tag, status, kind, teaching_content_outline, source_assessment_id, created_at",
                )
                .eq("account_id", accountId)
                .eq("employee_id", employeeId)
                .eq("cohort_id", cohortId)
                .order("created_at", { ascending: true }),
            ]);

          const passingByChapter = new Map<string, number>();
          (chapterBlueprints ?? []).forEach((b) => {
            if (b.chapter_code) passingByChapter.set(b.chapter_code, b.passing_score ?? PASS_MARK);
          });
          const passingByBlueprint = new Map<string, number>();
          (moduleBlueprints ?? []).forEach((b) => {
            passingByBlueprint.set(b.blueprint_code, b.passing_score ?? PASS_MARK);
          });
          blueprintRows = (moduleBlueprints ?? []) as any;
          microRows = ((micros ?? []) as any[]).filter(
            (m) => (m.teaching_content_outline ?? "").trim().length > 0,
          ) as any;

          // Keep the LATEST attempt per identifier (highest attempt_number, then
          // most recent timestamp) and count how many attempts exist.
          const byKey = new Map<
            string,
            {
              score: number | null;
              ts: string;
              attempt: number;
              status: string;
              passing: number;
              attemptCount: number;
              lockChapters: string[];
            }
          >();
          (instances ?? []).forEach((i) => {
            const key = i.blueprint_code ?? i.chapter_code ?? (i.metadata as any)?.assessment_id;
            if (!key) return;
            if (i.id) instanceIdToKey.set(i.id, key);
            const ts = i.completed_at ?? i.started_at ?? "";
            const attempt = i.attempt_number ?? 1;
            const passing =
              (i.blueprint_code && passingByBlueprint.get(i.blueprint_code)) ||
              (i.chapter_code && passingByChapter.get(i.chapter_code)) ||
              PASS_MARK;
            const lockChapters = Array.isArray(i.locks_retake_until_chapters)
              ? (i.locks_retake_until_chapters as any[]).filter((c): c is string => typeof c === "string")
              : [];
            const prev = byKey.get(key);
            const isNewer =
              !prev || attempt > prev.attempt || (attempt === prev.attempt && ts > prev.ts);
            byKey.set(key, {
              score: isNewer ? i.score : prev!.score,
              ts: isNewer ? ts : prev!.ts,
              attempt: isNewer ? attempt : prev!.attempt,
              status: isNewer ? i.status : prev!.status,
              passing,
              attemptCount: (prev?.attemptCount ?? 0) + 1,
              lockChapters: isNewer ? lockChapters : prev!.lockChapters,
            });
          });
          byKey.forEach((v, key) => {
            if (v.score == null) return;
            const passed = v.score >= v.passing;
            // A retake is blocked while any reopened chapter is still outstanding.
            const stillOutstanding = v.lockChapters.filter((code) => {
              const modCode = (instances ?? []).find(
                (i) => (i.blueprint_code ?? i.chapter_code) === key,
              )?.module_code;
              return progressMap.get(`${modCode}::${code}`) !== "completed";
            });
            assessmentByKey.set(key, {
              score: v.score,
              passed,
              passingScore: v.passing,
              locked: !passed && (v.status === "locked" || stillOutstanding.length > 0),
              attemptCount: v.attemptCount,
              retakeBlockedChapters: stillOutstanding,
            });
          });
        }

        // Group chapters by module
        const chaptersByModule = new Map<string, JourneyChapter[]>();
        (chapters ?? []).forEach((c) => {
          const key = `${c.module_code}::${c.chapter_code}`;
          const rawStatus = (progressMap.get(key) ?? "not_started") as ChapterStatus;
          const status: ChapterStatus = lockSet.has(key)
            ? "locked"
            : reopenSet.has(key) && rawStatus !== "completed"
              ? "in_progress"
              : rawStatus;
          const list = chaptersByModule.get(c.module_code) ?? [];
          const assessment = assessmentByKey.get(c.chapter_code);
          list.push({
            code: c.chapter_code,
            title: c.chapter_title,
            contentType: c.content_type ?? "reading",
            minutes: c.estimated_time_minutes ?? 0,
            status: assessment?.locked ? "locked" : status,
            displayOrder: c.display_order ?? 0,
            assessmentScore: assessment?.score,
            assessmentPassed: assessment?.passed,
            assessmentPassingScore: assessment?.passingScore,
            attemptCount: assessment?.attemptCount,
            retakeLocked: assessment?.locked && (assessment?.retakeBlockedChapters.length ?? 0) > 0,
            retakeBlockedChapters: assessment?.retakeBlockedChapters,
            metadata: (c as any).metadata ?? null,
          });
          chaptersByModule.set(c.module_code, list);
        });


        // 7d. Inject synthetic assessment "chapters" from blueprints.
        // module_post → appended last (displayOrder = 9999).
        // milestone   → just after the matching *.midpoint chapter (if any),
        //               otherwise mid-list at displayOrder = 500.
        blueprintRows.forEach((bp) => {
          const list = chaptersByModule.get(bp.module_code) ?? [];
          const result = assessmentByKey.get(bp.blueprint_code);
          let displayOrder = 9999;
          let title: string;
          let gateReason: string | undefined;
          const isMilestone = bp.scope === "milestone";
          if (isMilestone) {
            const midpoint = list.find((c) => c.code.endsWith(".midpoint"));
            displayOrder = midpoint ? midpoint.displayOrder + 1 : 500;
            title = `Milestone check — ${bp.assessment_title || "milestone"}`;
          } else {
            title = `Module assessment — ${bp.assessment_title || "post-module"}`;
            // Gate: every learning chapter done AND the midpoint check passed.
            const learningChapters = list.filter((c) => c.contentType !== "assessment" && !c.remediationKind);
            const outstanding = learningChapters.filter(
              (c) => c.status !== "completed" && c.status !== ("skipped" as any),
            );
            const midpoint = list.find((c) => c.code.endsWith(".midpoint"));
            if (outstanding.length > 0) {
              gateReason = `Complete the remaining ${outstanding.length} chapter${
                outstanding.length === 1 ? "" : "s"
              } in this module first`;
            } else if (midpoint && midpoint.assessmentScore != null && !midpoint.assessmentPassed) {
              gateReason = "Pass the midpoint check before the module assessment";
            }
          }
          // Status: completed if a passing attempt exists, locked when the last
          // attempt was locked or the module gate isn't met yet.
          const status: ChapterStatus = result?.passed
            ? "completed"
            : result?.locked || gateReason
              ? "locked"
              : "not_started";
          list.push({
            code: bp.blueprint_code,
            title,
            contentType: "assessment",
            minutes: 10,
            status,
            displayOrder,
            assessmentScore: result?.score,
            assessmentPassed: result?.passed,
            assessmentPassingScore: result?.passingScore,
            attemptCount: result?.attemptCount,
            retakeLocked: result?.locked && (result?.retakeBlockedChapters.length ?? 0) > 0,
            retakeBlockedChapters: result?.retakeBlockedChapters,
            gateReason,
          });
          chaptersByModule.set(bp.module_code, list);
        });

        // 7e. Inject the learner's own remediation chapters (micro-learnings
        // after a failed check, gap modules after a pass that still had gaps)
        // directly beneath the assessment that produced them.
        microRows.forEach((mr) => {
          if (!mr.module_code) return;
          const list = chaptersByModule.get(mr.module_code);
          if (!list) return;
          const sourceKey = mr.source_assessment_id
            ? instanceIdToKey.get(mr.source_assessment_id)
            : undefined;
          const source =
            (sourceKey && list.find((c) => c.code === sourceKey)) ||
            list.find((c) => c.code.endsWith(".midpoint")) ||
            [...list].sort((a, b) => b.displayOrder - a.displayOrder).find((c) => c.contentType === "assessment");
          const kind = (mr.kind === "gap_module" ? "gap_module" : "micro_learning") as
            | "gap_module"
            | "micro_learning";
          const topic = mr.topic_tag?.trim() || "key topic";
          list.push({
            code: `__micro::${mr.id}`,
            title:
              kind === "gap_module"
                ? `Gap module — ${topic}`
                : `Micro-learning — ${topic}`,
            contentType: "reading",
            minutes: 5,
            status:
              mr.status === "completed"
                ? "completed"
                : mr.status === "in_progress"
                  ? "in_progress"
                  : "not_started",
            displayOrder: (source?.displayOrder ?? 9998) + 0.5,
            remediationKind: kind,
            microLearningId: mr.id,
          });
          chaptersByModule.set(mr.module_code, list);
        });

        // Enforce sequential locking within each module: a chapter is locked until
        // the previous content chapter is completed. This handles "fresh" modules
        // where chapter_lock_events rows don't exist yet — without this, all
        // not_started chapters appear simultaneously unlocked.
        // Rules: first chapter is always available; assessments and remediation
        // chapters are excluded (they have their own gate/lock logic).
        for (const chs of chaptersByModule.values()) {
          chs.sort((a, b) => a.displayOrder - b.displayOrder);
          let prevDone = true; // first content chapter is always reachable
          for (const ch of chs) {
            if (ch.contentType === "assessment" || ch.remediationKind) continue;
            if (!prevDone && ch.status === "not_started") {
              ch.status = "locked";
            }
            prevDone = ch.status === "completed";
          }
        }

        // Build modules
        const moduleByCode = new Map<string, JourneyModule>();
        (modules ?? []).forEach((m) => {
          const chs = (chaptersByModule.get(m.module_code) ?? []).sort(
            (a, b) => a.displayOrder - b.displayOrder
          );
          const completedChapters = chs.filter((c) => c.status === "completed").length;
          const totalChapters = chs.length;
          const pct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

          // Module-level lock = entire module marker (chapter_code = "" / null)
          const moduleLockKey = `${m.module_code}::`;
          const moduleLocked =
            lockSet.has(moduleLockKey) || (chs.length > 0 && chs.every((c) => c.status === "locked"));

          let status: ModuleStatus;
          if (totalChapters > 0 && completedChapters === totalChapters) status = "completed";
          else if (chs.some((c) => c.status === "in_progress")) status = "in_progress";
          else if (completedChapters > 0) status = "in_progress";
          else if (moduleLocked) status = "locked";
          else status = "up_next";

          moduleByCode.set(m.module_code, {
            code: m.module_code,
            title: m.module_title,
            summary: m.module_summary ?? undefined,
            trackCode: m.learning_track_code,
            isCoreRequired: m.is_core_required ?? true,
            isStretch: m.is_stretch_module ?? false,
            prerequisiteCodes: m.prerequisite_module_codes ?? [],
            chapters: chs,
            completedChapters,
            totalChapters,
            pct,
            status,
            displayOrder: m.display_order ?? 0,
            adaptation: adaptationByModule.get(m.module_code),
          });
        });

        // Hide modules whose adaptation says "Already covered" + not visible
        moduleByCode.forEach((mod, code) => {
          const a = mod.adaptation;
          if (a && a.adaptationType === "skip_after_validation" && !a.visibleToLearner) {
            moduleByCode.delete(code);
          }
        });

        // Resolve prerequisite titles + auto-lock if prereq isn't completed
        moduleByCode.forEach((mod) => {
          if (mod.prerequisiteCodes.length > 0) {
            const firstUnmet = mod.prerequisiteCodes
              .map((c) => moduleByCode.get(c))
              .find((m) => m && m.status !== "completed");
            if (firstUnmet) {
              mod.prerequisiteTitle = firstUnmet.title;
              if (mod.status === "up_next") mod.status = "locked";
            }
          }
        });

        // Build tracks
        const trackList: JourneyTrack[] = (tracks ?? []).map((t) => {
          const mods = Array.from(moduleByCode.values())
            .filter((m) => m.trackCode === t.code)
            .sort((a, b) => {
              // core first, then stretch; preserve display order
              if (a.isStretch !== b.isStretch) return a.isStretch ? 1 : -1;
              return a.displayOrder - b.displayOrder;
            });
          const completedChapters = mods.reduce((s, m) => s + m.completedChapters, 0);
          const totalChapters = mods.reduce((s, m) => s + m.totalChapters, 0);
          const completedModules = mods.filter((m) => m.status === "completed").length;
          return {
            code: t.code,
            name: t.name,
            displayOrder: t.display_order ?? 0,
            modules: mods,
            completedChapters,
            totalChapters,
            completedModules,
            totalModules: mods.length,
            pct: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
          };
        });

        // Cohort totals
        const totalChapters = trackList.reduce((s, t) => s + t.totalChapters, 0);
        const completedChapters = trackList.reduce((s, t) => s + t.completedChapters, 0);
        const totalModules = trackList.reduce((s, t) => s + t.totalModules, 0);
        const completedModules = trackList.reduce((s, t) => s + t.completedModules, 0);

        const journey: LearnerJourney = {
          cohort: {
            id: cohortRow.id,
            code: cohortRow.cohort_code,
            title: cohortRow.cohort_title,
            roleCohortCode: cohortRow.role_cohort_code,
            dueDate: cohortRow.due_date,
            startDate: cohortRow.start_date,
            completedModules,
            totalModules,
            completedChapters,
            totalChapters,
            overallPct:
              totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
          },
          tracks: trackList,
        };

        if (!cancelled) setState({ journey, isLoading: false, error: null });
      } catch (e: any) {
        if (!cancelled)
          setState({ journey: null, isLoading: false, error: e?.message ?? "Failed to load journey" });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const refresh = useMemo(() => () => setRefreshTick((n) => n + 1), []);
  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
