// Reset & seed the Rathbones (account 6c49ca7c-fecb-4b34-a690-7e4e28bb2194) demo state.
//
// Wipes learner_progress / assessment_instances / chapter_lock_events /
// micro_learnings / learner_analytics for the 9 personas, then projects each
// persona through the *real* assoc_im modules and chapters so the manager
// dashboard and the learner experience read from one source of truth.
//
// Implements the two adaptive rules at seed time so the resulting DB state
// looks exactly as it would after live runs of those rules:
//   Rule A — for any assessment scored < 100, drop micro_learnings rows for
//            every wrong question.
//   Rule B — for any midpoint assessment scored < passing_score, write
//            chapter_lock_events (unlocked_at=null) for the chapters that
//            taught the wrong topic tags, and reset matching learner_progress
//            rows to in_progress.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ACCOUNT_ID = "6c49ca7c-fecb-4b34-a690-7e4e28bb2194";
const COHORT_ID = "11111111-1111-1111-1111-111111111111";
const PERSONA_IDS = ["rb-l1", "rb-l2", "rb-l3", "rb-l4", "rb-l5", "rb-l6", "rb-l7", "rb-l8", "rb-l9"];

type ModuleState = "completed" | "in_progress" | "not_started" | "locked";

interface PersonaModuleSpec {
  module_code: string;
  state: ModuleState;
  /** For in_progress: chapters completed before the current one (0-based count). */
  in_progress_at?: number;
  /** Assessment outcome for module_post / midpoint blueprints. */
  assessment_score?: number;
  /** Days ago the most recent activity on this module landed. */
  days_ago?: number;
  /** Topic tags the persona got wrong (drives Rule A micro_learnings + Rule B reopens). */
  wrong_tags?: string[];
  /** If true, write a midpoint-style attempt that triggers Rule B (reopens chapters). */
  midpoint_fail?: boolean;
  /** Retake outcome after Rule B reopens — second attempt score. */
  retake_score?: number;
}

interface PersonaSpec {
  employee_id: string;
  /** Most recent activity day offset (days ago). */
  last_activity_days_ago: number;
  modules: PersonaModuleSpec[];
}

// ─── Persona specs ──────────────────────────────────────────────────────────
// Clara (rb-l3) — Rising star.
const CLARA: PersonaSpec = {
  employee_id: "rb-l3",
  last_activity_days_ago: 0,
  modules: [
    { module_code: "bk1.intro_wealth_rathbones", state: "completed", assessment_score: 96, days_ago: 70 },
    { module_code: "bk2.kyc_suitability",        state: "completed", assessment_score: 94, days_ago: 64 },
    { module_code: "bk3.markets_macro_assets",   state: "completed", assessment_score: 100, days_ago: 56 },
    { module_code: "bk4.portfolio_construction", state: "completed", assessment_score: 92, days_ago: 48 },
    { module_code: "bk5.regulatory_landscape",   state: "completed", assessment_score: 98, days_ago: 40 },
    { module_code: "tk1.charles_river_ims",      state: "completed", assessment_score: 95, days_ago: 32 },
    { module_code: "tk2.bloomberg_essentials",   state: "completed", assessment_score: 93, days_ago: 25 },
    { module_code: "tk3.performance_attribution",state: "completed", assessment_score: 88, days_ago: 18, wrong_tags: ["attribution_drift"] },
    { module_code: "tk4.risk_mandate_restrictions", state: "completed", assessment_score: 92, days_ago: 12 },
    { module_code: "tk5.tax_wrappers",           state: "in_progress", in_progress_at: 4, days_ago: 1 },
    { module_code: "bs1.client_communication",   state: "completed", assessment_score: 95, days_ago: 22 },
    { module_code: "bs2.difficult_conversations",state: "completed", assessment_score: 90, days_ago: 15 },
    { module_code: "cps3.smcr_conduct",          state: "completed", assessment_score: 100, days_ago: 35 },
    { module_code: "cps4.aml_financial_crime",   state: "completed", assessment_score: 96, days_ago: 28 },
    { module_code: "oe1.systems_tour",           state: "completed", days_ago: 68 },
    { module_code: "oe2.mentor_buddy",           state: "completed", days_ago: 62 },
    { module_code: "oe3.reflective_practice",    state: "completed", days_ago: 50 },
    { module_code: "str1.lead_client_review",    state: "in_progress", in_progress_at: 0, days_ago: 0 },
  ],
};

// Theo (rb-l2) — At risk.
const THEO: PersonaSpec = {
  employee_id: "rb-l2",
  last_activity_days_ago: 6,
  modules: [
    { module_code: "bk1.intro_wealth_rathbones", state: "completed", assessment_score: 78, days_ago: 50 },
    { module_code: "bk2.kyc_suitability",        state: "completed", assessment_score: 62, retake_score: 81, midpoint_fail: true, days_ago: 40, wrong_tags: ["suitability_review", "client_segmentation", "consumer_duty"] },
    { module_code: "bk3.markets_macro_assets",   state: "in_progress", in_progress_at: 3, days_ago: 18 },
    { module_code: "bk4.portfolio_construction", state: "not_started" },
    { module_code: "bk5.regulatory_landscape",   state: "not_started" },
    { module_code: "tk1.charles_river_ims",      state: "in_progress", in_progress_at: 2, midpoint_fail: true, assessment_score: 40, days_ago: 12, wrong_tags: ["order_workflow", "compliance_checks", "ims_routing", "trade_lifecycle", "exception_handling"] },
    { module_code: "cps4.aml_financial_crime",   state: "in_progress", in_progress_at: 3, assessment_score: 55, days_ago: 8, wrong_tags: ["sar_filing", "pep_screening", "transaction_monitoring", "edd_thresholds"] },
    { module_code: "oe1.systems_tour",           state: "completed", days_ago: 52 },
  ],
};

// Beth (rb-l5) — Needs check-in.
const BETH: PersonaSpec = {
  employee_id: "rb-l5",
  last_activity_days_ago: 4,
  modules: [
    { module_code: "bk1.intro_wealth_rathbones", state: "completed", assessment_score: 88, days_ago: 38 },
    { module_code: "bk2.kyc_suitability",        state: "completed", assessment_score: 85, days_ago: 32 },
    { module_code: "bk3.markets_macro_assets",   state: "completed", assessment_score: 90, days_ago: 25 },
    { module_code: "bk4.portfolio_construction", state: "completed", assessment_score: 84, days_ago: 18 },
    { module_code: "bk5.regulatory_landscape",   state: "completed", assessment_score: 82, days_ago: 12 },
    { module_code: "tk1.charles_river_ims",      state: "completed", assessment_score: 76, days_ago: 4, wrong_tags: ["order_workflow", "compliance_checks"] },
    { module_code: "tk2.bloomberg_essentials",   state: "in_progress", in_progress_at: 1, days_ago: 4 },
    { module_code: "oe1.systems_tour",           state: "completed", days_ago: 40 },
  ],
};

// Kofi (rb-l7) — Rising star (emerging).
const KOFI: PersonaSpec = {
  employee_id: "rb-l7",
  last_activity_days_ago: 1,
  modules: [
    { module_code: "bk1.intro_wealth_rathbones", state: "completed", assessment_score: 94, days_ago: 30 },
    { module_code: "bk2.kyc_suitability",        state: "completed", assessment_score: 91, days_ago: 22 },
    { module_code: "bk3.markets_macro_assets",   state: "completed", assessment_score: 95, days_ago: 14 },
    { module_code: "bk4.portfolio_construction", state: "in_progress", in_progress_at: 5, days_ago: 1 },
    { module_code: "oe1.systems_tour",           state: "completed", days_ago: 32 },
    { module_code: "oe2.mentor_buddy",           state: "completed", days_ago: 28 },
  ],
};

// Generic on-track baseline used for rb-l1, rb-l4, rb-l6, rb-l8, rb-l9.
function baselineSpec(employee_id: string, weeksAgoStart: number, modulesDone: number): PersonaSpec {
  const ordered = [
    "bk1.intro_wealth_rathbones",
    "bk2.kyc_suitability",
    "bk3.markets_macro_assets",
    "bk4.portfolio_construction",
    "bk5.regulatory_landscape",
    "tk1.charles_river_ims",
    "tk2.bloomberg_essentials",
    "tk3.performance_attribution",
  ];
  const startDays = weeksAgoStart * 7;
  const stepDays = Math.max(2, Math.floor(startDays / Math.max(1, modulesDone + 1)));
  const modules: PersonaModuleSpec[] = [];
  for (let i = 0; i < Math.min(modulesDone, ordered.length); i++) {
    modules.push({
      module_code: ordered[i],
      state: "completed",
      assessment_score: 82 + (i % 4) * 2,
      days_ago: Math.max(2, startDays - (i + 1) * stepDays),
    });
  }
  if (modulesDone < ordered.length) {
    modules.push({ module_code: ordered[modulesDone], state: "in_progress", in_progress_at: Math.floor(Math.random() * 3), days_ago: 3 });
  }
  modules.push({ module_code: "oe1.systems_tour", state: "completed", days_ago: startDays - 2 });
  return { employee_id, last_activity_days_ago: 3, modules };
}

const ALL_SPECS: PersonaSpec[] = [
  baselineSpec("rb-l1", 6, 4),
  THEO,
  CLARA,
  baselineSpec("rb-l4", 7, 5),
  BETH,
  baselineSpec("rb-l6", 9, 7),
  KOFI,
  baselineSpec("rb-l8", 5, 3),
  baselineSpec("rb-l9", 8, 6),
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── HTTP handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Load catalog reference data for the cohort.
    const [modsRes, chsRes, bpsRes] = await Promise.all([
      supabase.from("catalog_modules").select("module_code, role_cohort_code").eq("account_id", ACCOUNT_ID).eq("role_cohort_code", "assoc_im"),
      supabase.from("catalog_chapters").select("module_code, chapter_code, display_order, topic_tags").eq("account_id", ACCOUNT_ID),
      supabase.from("catalog_assessment_blueprints").select("module_code, blueprint_code, scope, passing_score").eq("account_id", ACCOUNT_ID),
    ]);
    if (modsRes.error) throw modsRes.error;
    if (chsRes.error) throw chsRes.error;
    if (bpsRes.error) throw bpsRes.error;

    const validModuleCodes = new Set((modsRes.data ?? []).map((m: any) => m.module_code));
    const chaptersByModule: Record<string, { chapter_code: string; display_order: number; topic_tags: string[] }[]> = {};
    for (const c of (chsRes.data ?? []) as any[]) {
      if (!chaptersByModule[c.module_code]) chaptersByModule[c.module_code] = [];
      chaptersByModule[c.module_code].push({
        chapter_code: c.chapter_code,
        display_order: c.display_order ?? 0,
        topic_tags: c.topic_tags ?? [],
      });
    }
    for (const k of Object.keys(chaptersByModule)) {
      chaptersByModule[k].sort((a, b) => a.display_order - b.display_order);
    }
    const blueprintByModule: Record<string, { blueprint_code: string; scope: string; passing_score: number }> = {};
    for (const b of (bpsRes.data ?? []) as any[]) {
      // Prefer module_post over midpoint when both exist; the seed treats midpoint as an extra failed attempt.
      if (!blueprintByModule[b.module_code] || b.scope === "module_post") {
        blueprintByModule[b.module_code] = { blueprint_code: b.blueprint_code, scope: b.scope, passing_score: b.passing_score ?? 80 };
      }
    }

    // Wipe prior demo state for the 9 personas.
    for (const tbl of ["micro_learnings", "chapter_lock_events", "assessment_instances", "learner_progress", "learner_analytics"]) {
      const { error } = await supabase.from(tbl).delete().eq("account_id", ACCOUNT_ID).in("employee_id", PERSONA_IDS);
      if (error) throw new Error(`wipe ${tbl}: ${error.message}`);
    }

    // Ensure all 9 are enrolled in the cohort.
    const enrollRows = PERSONA_IDS.map((employee_id) => ({
      account_id: ACCOUNT_ID,
      cohort_id: COHORT_ID,
      employee_id,
      status: "active",
      enrolled_at: isoDaysAgo(70),
    }));
    // Upsert via delete-then-insert on the persona scope (table has no unique constraint to upsert on).
    await supabase.from("cohort_enrollments").delete().eq("account_id", ACCOUNT_ID).eq("cohort_id", COHORT_ID).in("employee_id", PERSONA_IDS);
    {
      const { error } = await supabase.from("cohort_enrollments").insert(enrollRows);
      if (error) throw error;
    }

    // Accumulators
    const learnerProgressRows: any[] = [];
    const assessmentRows: any[] = [];
    const lockRows: any[] = [];
    const microRows: any[] = [];
    const analyticsRows: any[] = [];

    for (const spec of ALL_SPECS) {
      let totalAttempts = 0;
      let totalRetakes = 0;
      let totalMicros = 0;
      const weakTags = new Set<string>();
      const strongTags = new Set<string>();

      for (const m of spec.modules) {
        if (!validModuleCodes.has(m.module_code)) continue;
        const chs = chaptersByModule[m.module_code] ?? [];
        const baseDays = m.days_ago ?? spec.last_activity_days_ago;

        if (m.state === "completed") {
          // Walk chapters backwards from baseDays.
          chs.forEach((ch, i) => {
            const completedAt = isoDaysAgo(Math.max(1, baseDays + (chs.length - 1 - i)));
            learnerProgressRows.push({
              account_id: ACCOUNT_ID,
              cohort_id: COHORT_ID,
              employee_id: spec.employee_id,
              module_code: m.module_code,
              chapter_code: ch.chapter_code,
              status: "completed",
              started_at: completedAt,
              completed_at: completedAt,
            });
          });
        } else if (m.state === "in_progress") {
          const cutoff = Math.max(0, Math.min(m.in_progress_at ?? Math.floor(chs.length / 2), chs.length));
          chs.forEach((ch, i) => {
            const status = i < cutoff ? "completed" : i === cutoff ? "in_progress" : "not_started";
            const completedAt = status === "completed" ? isoDaysAgo(Math.max(1, baseDays + (cutoff - i))) : null;
            learnerProgressRows.push({
              account_id: ACCOUNT_ID,
              cohort_id: COHORT_ID,
              employee_id: spec.employee_id,
              module_code: m.module_code,
              chapter_code: ch.chapter_code,
              status,
              started_at: status === "not_started" ? null : completedAt ?? isoDaysAgo(baseDays),
              completed_at: completedAt,
            });
          });
        }
        // not_started / locked: write nothing — useLearnerJourney will treat as not_started.

        // Assessment + Rule A + Rule B
        if (m.assessment_score != null) {
          const bp = blueprintByModule[m.module_code];
          const attemptDays = Math.max(1, baseDays);
          totalAttempts += 1;
          const assessmentId = crypto.randomUUID();
          const isMidpoint = !!m.midpoint_fail;
          assessmentRows.push({
            id: assessmentId,
            account_id: ACCOUNT_ID,
            cohort_id: COHORT_ID,
            employee_id: spec.employee_id,
            blueprint_code: bp?.blueprint_code ?? `${m.module_code}.assessment`,
            module_code: m.module_code,
            kind: "module_post",
            attempt_number: 1,
            generated_questions: [],
            learner_responses: [],
            score: m.assessment_score,
            weak_topic_tags: m.wrong_tags ?? [],
            strong_topic_tags: [],
            status: "completed",
            started_at: isoDaysAgo(attemptDays + 1),
            completed_at: isoDaysAgo(attemptDays),
            metadata: { scope: isMidpoint ? "midpoint" : "module_post", seeded: true },
          });
          (m.wrong_tags ?? []).forEach((t) => weakTags.add(t));

          // Rule A — micro_learnings for the missed slice.
          if (m.assessment_score < 100) {
            (m.wrong_tags ?? []).forEach((tag) => {
              microRows.push({
                account_id: ACCOUNT_ID,
                cohort_id: COHORT_ID,
                employee_id: spec.employee_id,
                source_assessment_id: assessmentId,
                failed_question: `Question on ${tag.replace(/_/g, " ")} (auto-derived from assessment)`,
                learner_answer: "Partial / incorrect",
                correct_answer: "See teaching outline below",
                why_wrong: `Misapplied the ${tag.replace(/_/g, " ")} rule under the scenario's constraints.`,
                teaching_content_outline: `Refresher: principles of ${tag.replace(/_/g, " ")}, worked example, common pitfalls.`,
                practical_activity: `Re-run the scenario with corrected ${tag.replace(/_/g, " ")} reasoning and capture your steps.`,
                chapters: chs.filter((c) => c.topic_tags?.includes(tag)).map((c) => c.chapter_code),
                status: "pending",
              });
              totalMicros += 1;
            });
          }

          // Rule B — midpoint fail reopens chapters that taught the wrong tags.
          if (isMidpoint && m.assessment_score < (bp?.passing_score ?? 80)) {
            const tagsToReopen = m.wrong_tags ?? [];
            const reopened = new Set<string>();
            for (const tag of tagsToReopen) {
              for (const ch of chs) {
                if (ch.topic_tags?.includes(tag) && !reopened.has(ch.chapter_code)) {
                  reopened.add(ch.chapter_code);
                  lockRows.push({
                    account_id: ACCOUNT_ID,
                    cohort_id: COHORT_ID,
                    employee_id: spec.employee_id,
                    module_code: m.module_code,
                    chapter_code: ch.chapter_code,
                    unlocked_at: null,
                    reason: "reopened_for_midpoint_remediation",
                    triggered_by_assessment_id: assessmentId,
                  });
                  // Reset matching learner_progress row to in_progress.
                  const idx = learnerProgressRows.findIndex(
                    (r) => r.employee_id === spec.employee_id && r.chapter_code === ch.chapter_code && r.module_code === m.module_code,
                  );
                  if (idx >= 0) {
                    learnerProgressRows[idx].status = "in_progress";
                    learnerProgressRows[idx].completed_at = null;
                  }
                }
              }
            }

            // Retake attempt persisted on top of the first.
            if (m.retake_score != null) {
              totalAttempts += 1;
              totalRetakes += 1;
              assessmentRows.push({
                id: crypto.randomUUID(),
                account_id: ACCOUNT_ID,
                cohort_id: COHORT_ID,
                employee_id: spec.employee_id,
                blueprint_code: bp?.blueprint_code ?? `${m.module_code}.assessment`,
                module_code: m.module_code,
                kind: "module_post",
                attempt_number: 2,
                generated_questions: [],
                learner_responses: [],
                score: m.retake_score,
                weak_topic_tags: [],
                strong_topic_tags: m.wrong_tags ?? [],
                status: "completed",
                started_at: isoDaysAgo(Math.max(1, attemptDays - 2)),
                completed_at: isoDaysAgo(Math.max(1, attemptDays - 3)),
                metadata: { scope: "module_post", seeded: true, follows_midpoint_fail: true },
              });
              (m.wrong_tags ?? []).forEach((t) => strongTags.add(t));
            }
          }
        }
      }

      analyticsRows.push({
        account_id: ACCOUNT_ID,
        cohort_id: COHORT_ID,
        employee_id: spec.employee_id,
        total_assessment_attempts: totalAttempts,
        total_retakes: totalRetakes,
        total_micro_learnings: totalMicros,
        rolling_weak_topic_tags: Array.from(weakTags),
        rolling_strong_topic_tags: Array.from(strongTags),
        last_activity_at: isoDaysAgo(spec.last_activity_days_ago),
      });
    }

    // Bulk insert (chunked).
    async function bulkInsert(table: string, rows: any[]) {
      for (const batch of chunk(rows, 500)) {
        if (!batch.length) continue;
        const { error } = await supabase.from(table).insert(batch);
        if (error) throw new Error(`${table}: ${error.message}`);
      }
    }

    await bulkInsert("learner_progress", learnerProgressRows);
    await bulkInsert("assessment_instances", assessmentRows);
    await bulkInsert("chapter_lock_events", lockRows);
    await bulkInsert("micro_learnings", microRows);
    await bulkInsert("learner_analytics", analyticsRows);

    return new Response(
      JSON.stringify({
        ok: true,
        counts: {
          enrollments: enrollRows.length,
          learner_progress: learnerProgressRows.length,
          assessment_instances: assessmentRows.length,
          chapter_lock_events: lockRows.length,
          micro_learnings: microRows.length,
          learner_analytics: analyticsRows.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
