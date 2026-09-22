// Seed per-persona Skills (employee_capability_proficiency + persona_competency_profiles)
// for the 9 Rathbones learner personas.
//
// SOURCE OF TRUTH: the existing journey data (assessment_instances,
// learner_analytics, learner_progress, chapter_lock_events) drives most
// spike/gap signals. A small hand-authored PERSONA_BIAS table fills in
// narrative items the journey cannot infer (prior employer, certifications,
// mentor relationships) WITHOUT overriding any journey-derived value.
//
// Run order: reset-rathbones-demo first, then this. Idempotent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RATHBONES_ID = "6c49ca7c-fecb-4b34-a690-7e4e28bb2194";
const PINNACLE_ID = "08b9c4d5-f4ec-44bb-8bc2-099d9848f465";
const PERSONA_IDS = ["rb-l1", "rb-l2", "rb-l3", "rb-l4", "rb-l5", "rb-l6", "rb-l7", "rb-l8", "rb-l9"];

// ─── Module → primary competency map ────────────────────────────────────────
// Drives the parent-level proficiency bump when a module is completed. Sub-skill
// bumps are derived from each module's `target_capabilities` (in catalog_modules)
// matched against `competency_catalog.supporting_skills`.
const MODULE_TO_COMPETENCY: Record<string, string> = {
  "bk1.intro_wealth_rathbones":   "bk.strategy_culture",
  "bk2.kyc_suitability":          "tk.client_suitability",
  "bk3.markets_macro_assets":     "tk.research_analysis",
  "bk4.portfolio_construction":   "tk.investment_expertise",
  "bk5.regulatory_landscape":     "tk.regulatory_risk",
  "bs1.client_communication":     "bs.client_facing",
  "bs2.difficult_conversations":  "bs.client_facing",
  "bs3.delegation_stakeholders":  "bs.collab_leadership",
  "bs4.judgement_ethics":         "bs.judgement_mindset",
  "bs5.time_prioritisation":      "bs.collab_leadership",
  "cps1.cisi_ioc_securities":     "cps.cisi_l7_readiness",
  "cps2.cisi_iad_bridge":         "cps.cisi_l7_readiness",
  "cps3.smcr_conduct":            "cps.regulatory_consumer_duty",
  "cps4.aml_financial_crime":     "cps.regulatory_consumer_duty",
  "cps5.cpd_plan":                "cps.cpd",
  "oe1.systems_tour":             "oe.systems_data_ai",
  "oe2.mentor_buddy":             "oe.mentoring_coaching",
  "oe3.reflective_practice":      "oe.cultural_perf",
  "oe4.working_with_planners":    "bk.operating_model",
  "str1.lead_client_review":      "bs.client_facing",
  "str2.investment_thesis":       "tk.research_analysis",
  "str3.mentoring_juniors":       "bs.collab_leadership",
  "tk1.charles_river_ims":        "oe.systems_data_ai",
  "tk2.bloomberg_essentials":     "oe.systems_data_ai",
  "tk3.performance_attribution":  "tk.research_analysis",
  "tk4.risk_mandate_restrictions":"tk.regulatory_risk",
  "tk5.tax_wrappers":             "tk.client_suitability",
  "tk6.esg_responsible_investing":"tk.investment_expertise",
  "tk7.ops_workflows":            "bk.operating_model",
};

// ─── Topic-tag → sub-skill code map ─────────────────────────────────────────
// When a topic tag appears in weak_topic_tags / rolling_weak_topic_tags, map
// it onto the matching `{competency_id}::{sub_skill}` capability code so we
// can mark that sub-skill as pending / weak.
const TAG_TO_SUBSKILL: Record<string, string[]> = {
  suitability_review:      ["tk.client_suitability::suitability_assessment"],
  client_segmentation:     ["tk.client_suitability::suitability_assessment", "bk.clients_markets::client_segmentation"],
  consumer_duty:           ["cps.regulatory_consumer_duty::consumer_duty_application"],
  order_workflow:          ["oe.systems_data_ai::charles_river_navigation"],
  compliance_checks:       ["tk.regulatory_risk::pre_trade_compliance"],
  ims_routing:             ["oe.systems_data_ai::charles_river_navigation"],
  trade_lifecycle:         ["oe.systems_data_ai::charles_river_navigation"],
  exception_handling:      ["oe.systems_data_ai::charles_river_navigation"],
  sar_filing:              ["cps.regulatory_consumer_duty::aml_red_flag_detection"],
  pep_screening:           ["cps.regulatory_consumer_duty::aml_red_flag_detection"],
  transaction_monitoring:  ["cps.regulatory_consumer_duty::aml_red_flag_detection"],
  edd_thresholds:          ["cps.regulatory_consumer_duty::aml_red_flag_detection"],
  attribution_drift:       ["tk.research_analysis::attribution_analysis"],
};

// ─── Career-band baselines ──────────────────────────────────────────────────
function bandFor(id: string): "early" | "mid" | "exp" {
  const n = Number(id.replace("rb-l", ""));
  if (n <= 3) return "early";
  if (n <= 6) return "mid";
  return "exp";
}
function baselineLevel(band: "early" | "mid" | "exp"): number {
  return band === "early" ? 2 : band === "mid" ? 3 : 3;
}

// ─── Persona bias (narrative items the journey cannot infer) ────────────────
// Bias never overrides a journey-derived value; only fills gaps.
interface BiasEntry {
  code: string;
  level: number;
  source?: "validated" | "self_claimed" | "pending" | "ai_inferred";
  confidence?: "low" | "medium" | "high";
  rationale: string;
}
const PERSONA_BIAS: Record<string, BiasEntry[]> = {
  // rb-l1 Sophie Linden — early, from outside FS, strong people background.
  "rb-l1": [
    { code: "bs.client_facing::client_rapport_building", level: 3, source: "self_claimed", rationale: "Brings client-facing experience from prior hospitality / retail role." },
    { code: "bs.client_facing::active_listening", level: 3, source: "ai_inferred", rationale: "Inferred from cross-domain conversations and reflection notes." },
  ],
  // rb-l2 Maya Holloway — early, FS but non-IM. Found Charles River + KYC hard.
  "rb-l2": [
    { code: "cps.cisi_l7_readiness::cisi_ioc_securities_readiness", level: 2, source: "pending", rationale: "CISI IOC Securities study booked; foundational only." },
    { code: "bk.operating_model::risk_awareness", level: 3, source: "self_claimed", rationale: "Carried over from prior compliance-adjacent FS role." },
  ],
  // rb-l3 Theo Marchant — early, in-IM, rising star.
  "rb-l3": [
    { code: "cps.cisi_l7_readiness::cisi_ioc_securities_readiness", level: 4, source: "validated", rationale: "CISI IOC Securities passed in last cycle." },
    { code: "oe.mentoring_coaching::mentor_relationship_setup", level: 4, source: "validated", rationale: "Active mentee with assigned mentor." },
  ],
  // rb-l4 Owen Castell — mid, from outside FS.
  "rb-l4": [
    { code: "bs.collab_leadership::initiative_taking", level: 4, source: "ai_inferred", rationale: "Inferred from prior team-lead role outside FS." },
    { code: "bk.clients_markets::market_commentary_authoring", level: 2, source: "pending", rationale: "Limited prior exposure to investment commentary." },
  ],
  // rb-l5 Priya Aldridge — mid, FS non-IM background.
  "rb-l5": [
    { code: "cps.regulatory_consumer_duty::conduct_rules_application", level: 4, source: "validated", rationale: "Conduct rules fluent from prior FS role." },
    { code: "oe.systems_data_ai::bloomberg_navigation", level: 2, source: "pending", rationale: "New to Bloomberg; familiar with comparable market-data tools." },
  ],
  // rb-l6 Clara Wren — mid, in-IM (primary onboarding persona).
  "rb-l6": [
    { code: "tk.investment_expertise::model_portfolio_application", level: 4, source: "validated", rationale: "Running model portfolios under IM supervision." },
    { code: "oe.mentoring_coaching::mentor_relationship_setup", level: 4, source: "validated", rationale: "Mentor pairing active; reviews logged." },
    { code: "cps.cisi_l7_readiness::cisi_iad_readiness", level: 3, source: "self_claimed", rationale: "IAD bridge study in progress." },
  ],
  // rb-l7 Rosa Belmont — experienced, from outside FS.
  "rb-l7": [
    { code: "bs.collab_leadership::peer_coaching", level: 4, source: "validated", rationale: "Coaches peers in cohort sessions." },
    { code: "cps.cpd::reflective_practice", level: 4, source: "self_claimed", rationale: "Maintains weekly reflective practice from prior career." },
  ],
  // rb-l8 Felix Arden — experienced, FS non-IM. Assistant IM persona.
  "rb-l8": [
    { code: "oe.systems_data_ai::charles_river_navigation", level: 4, source: "validated", rationale: "Fluent from prior CRD environment at previous firm." },
    { code: "tk.regulatory_risk::cobs_application", level: 4, source: "validated", rationale: "COBS-fluent from prior FS compliance work." },
    { code: "cps.cisi_l7_readiness::cisi_ioc_securities_readiness", level: 4, source: "validated", rationale: "CISI IOC Securities already held." },
  ],
  // rb-l9 Elliot Hayes — experienced, in-IM-adjacent, leadership-strong.
  "rb-l9": [
    { code: "bs.collab_leadership::initiative_taking", level: 4, source: "ai_inferred", rationale: "Inferred from prior leadership role." },
    { code: "bs.collab_leadership::peer_coaching", level: 4, source: "ai_inferred", rationale: "Inferred from prior management responsibilities." },
    { code: "tk.investment_expertise::portfolio_construction", level: 3, source: "self_claimed", rationale: "Conceptual depth; building Rathbones-specific application." },
  ],
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface AssessmentRow {
  employee_id: string;
  module_code: string;
  attempt_number: number;
  score: number;
  weak_topic_tags: string[];
  strong_topic_tags: string[];
  kind: string;
}
interface AnalyticsRow {
  employee_id: string;
  rolling_weak_topic_tags: string[];
  rolling_strong_topic_tags: string[];
}
interface ProgressRow { employee_id: string; module_code: string; status: string; }
interface LockRow { employee_id: string; module_code: string; chapter_code: string; }
interface CatalogModuleRow { module_code: string; target_capabilities: string[]; }
interface CompetencyRow { competency_id: string; supporting_skills: string[]; }

interface ComputedSkill {
  code: string;
  level: number;
  source: "validated" | "self_claimed" | "pending" | "ai_inferred";
  confidence: "low" | "medium" | "high";
  rationale: string;
  derivedFromJourney: boolean;
}

// ─── Compute per-persona skills ─────────────────────────────────────────────
function computePersona(
  employeeId: string,
  band: "early" | "mid" | "exp",
  competencies: CompetencyRow[],
  modules: CatalogModuleRow[],
  assessments: AssessmentRow[],
  analytics: AnalyticsRow | undefined,
  progress: ProgressRow[],
  locks: LockRow[],
): ComputedSkill[] {
  const base = baselineLevel(band);
  const subSkillToCompetency: Record<string, string> = {};
  for (const c of competencies) {
    for (const s of c.supporting_skills ?? []) {
      const k = `${c.competency_id}::${s}`;
      subSkillToCompetency[s] = k;
    }
  }
  const moduleToSubSkills: Record<string, string[]> = {};
  for (const m of modules) {
    moduleToSubSkills[m.module_code] = (m.target_capabilities ?? [])
      .map((tc) => subSkillToCompetency[tc])
      .filter(Boolean);
  }

  // Initialise all 76 codes at baseline.
  const out: Record<string, ComputedSkill> = {};
  for (const c of competencies) {
    out[c.competency_id] = {
      code: c.competency_id,
      level: base,
      source: "self_claimed",
      confidence: "low",
      rationale: `Baseline for ${band}-career band; not yet evidenced in journey.`,
      derivedFromJourney: false,
    };
    for (const s of c.supporting_skills ?? []) {
      const code = `${c.competency_id}::${s}`;
      out[code] = {
        code,
        level: base,
        source: "self_claimed",
        confidence: "low",
        rationale: "Baseline; awaiting evidence.",
        derivedFromJourney: false,
      };
    }
  }

  // Latest attempt per module.
  const latest: Record<string, AssessmentRow> = {};
  for (const a of assessments) {
    const cur = latest[a.module_code];
    if (!cur || a.attempt_number > cur.attempt_number) latest[a.module_code] = a;
  }
  const retakeOf = new Set<string>();
  for (const a of assessments) if (a.attempt_number > 1) retakeOf.add(a.module_code);

  const moduleTitle = (code: string) => code.replace(/^([a-z]+\d+)\./, "").replace(/_/g, " ");

  // Journey-derived bumps from assessments.
  for (const [modCode, att] of Object.entries(latest)) {
    const parent = MODULE_TO_COMPETENCY[modCode];
    const subs = moduleToSubSkills[modCode] ?? [];
    const targets = [parent, ...subs].filter(Boolean);
    if (!targets.length) continue;
    const score = Number(att.score ?? 0);
    const isRetake = retakeOf.has(modCode);

    let newLevel: number, src: ComputedSkill["source"], conf: ComputedSkill["confidence"], why: string;
    if (score >= 90) {
      newLevel = 4;
      src = "validated";
      conf = "high";
      why = `Demonstrated in ${moduleTitle(modCode)} assessment (${score}%).`;
    } else if (score >= 80) {
      newLevel = 3;
      src = "self_claimed";
      conf = "medium";
      why = `Passed ${moduleTitle(modCode)} assessment (${score}%).`;
    } else if (score >= 60) {
      newLevel = 2;
      src = "pending";
      conf = "low";
      why = `Partial pass in ${moduleTitle(modCode)} (${score}%); review pending.`;
    } else {
      newLevel = 1;
      src = "pending";
      conf = "low";
      why = `Did not meet pass mark in ${moduleTitle(modCode)} (${score}%); remediation underway.`;
    }
    if (isRetake && score >= 80) {
      newLevel = Math.max(newLevel, 3);
      src = "validated";
      conf = "high";
      why = `Recovered after retake of ${moduleTitle(modCode)} (${score}%).`;
    }

    for (const t of targets) {
      const cur = out[t];
      if (!cur) continue;
      // Take the strongest signal (max level). If equal, prefer journey-derived.
      if (newLevel >= cur.level) {
        cur.level = newLevel;
        cur.source = src;
        cur.confidence = conf;
        cur.rationale = why;
        cur.derivedFromJourney = true;
      }
    }
  }

  // Weak topic tags (rolling) — pull matching sub-skills down.
  const weakTags = new Set<string>(analytics?.rolling_weak_topic_tags ?? []);
  for (const tag of weakTags) {
    const subs = TAG_TO_SUBSKILL[tag] ?? [];
    for (const sub of subs) {
      const cur = out[sub];
      if (!cur) continue;
      cur.level = Math.min(cur.level, 2);
      cur.source = "pending";
      cur.confidence = "low";
      cur.rationale = `Weak signal on "${tag.replace(/_/g, " ")}" — flagged for revisit.`;
      cur.derivedFromJourney = true;
    }
  }
  // Strong rolling tags (post-retake) — promote.
  const strongTags = new Set<string>(analytics?.rolling_strong_topic_tags ?? []);
  for (const tag of strongTags) {
    const subs = TAG_TO_SUBSKILL[tag] ?? [];
    for (const sub of subs) {
      const cur = out[sub];
      if (!cur) continue;
      cur.level = Math.max(cur.level, 3);
      cur.source = "validated";
      cur.confidence = "high";
      cur.rationale = `Recovered on "${tag.replace(/_/g, " ")}" after retake.`;
      cur.derivedFromJourney = true;
    }
  }

  // Chapter lock events — sub-skills tied to reopened chapter modules stay low.
  const lockedModules = new Set(locks.map((l) => l.module_code));
  for (const m of lockedModules) {
    const subs = moduleToSubSkills[m] ?? [];
    for (const s of subs) {
      const cur = out[s];
      if (!cur) continue;
      // Only force down if no stronger validated signal exists.
      if (cur.source !== "validated") {
        cur.level = Math.min(cur.level, 2);
        cur.source = "pending";
        cur.rationale = `Chapter reopened for remediation in ${moduleTitle(m)}.`;
        cur.derivedFromJourney = true;
      }
    }
  }

  // Apply persona bias — fill gaps only, never overwrite journey-derived rows.
  for (const b of PERSONA_BIAS[employeeId] ?? []) {
    const cur = out[b.code];
    if (!cur) continue;
    if (cur.derivedFromJourney) continue;
    cur.level = b.level;
    cur.source = b.source ?? cur.source;
    cur.confidence = b.confidence ?? (b.source === "validated" ? "high" : "medium");
    cur.rationale = b.rationale;
  }

  // For parent competencies that ended up with no journey signal AND have at
  // least one validated child, lift the parent to the median of its children.
  for (const c of competencies) {
    const parent = out[c.competency_id];
    if (!parent || parent.derivedFromJourney) continue;
    const childLevels = (c.supporting_skills ?? [])
      .map((s) => out[`${c.competency_id}::${s}`]?.level ?? base);
    if (!childLevels.length) continue;
    const sorted = [...childLevels].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median > parent.level) {
      parent.level = median;
      parent.rationale = `Aggregated from supporting-skill evidence.`;
    }
  }

  return Object.values(out);
}

// ─── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { db: { schema: 'embarksmv2' } });

    const body = await req.json().catch(() => ({}));
    const accountId: string = body.account_id ?? RATHBONES_ID;
    const targetAccountIds: string[] = body.include_pinnacle
      ? [accountId, PINNACLE_ID]
      : [accountId];

    const summary: Record<string, unknown> = {};

    for (const accId of targetAccountIds) {
      // Load reference data for this account.
      const [{ data: competencies }, { data: modules }] = await Promise.all([
        supabase.from("competency_catalog").select("competency_id, supporting_skills").eq("account_id", accId),
        supabase.from("catalog_modules").select("module_code, target_capabilities").eq("account_id", accId),
      ]);
      if (!competencies?.length) {
        summary[accId] = { skipped: "no competency_catalog for account" };
        continue;
      }

      // Load journey signals for all personas in this account.
      const [{ data: assessments }, { data: analytics }, { data: progress }, { data: locks }] = await Promise.all([
        supabase.from("assessment_instances").select("employee_id, module_code, attempt_number, score, weak_topic_tags, strong_topic_tags, kind").eq("account_id", accId).in("employee_id", PERSONA_IDS),
        supabase.from("learner_analytics").select("employee_id, rolling_weak_topic_tags, rolling_strong_topic_tags").eq("account_id", accId).in("employee_id", PERSONA_IDS),
        supabase.from("learner_progress").select("employee_id, module_code, status").eq("account_id", accId).in("employee_id", PERSONA_IDS),
        supabase.from("chapter_lock_events").select("employee_id, module_code, chapter_code").eq("account_id", accId).in("employee_id", PERSONA_IDS),
      ]);

      const perPersona: Record<string, ComputedSkill[]> = {};
      for (const empId of PERSONA_IDS) {
        const band = bandFor(empId);
        const a = (assessments ?? []).filter((r) => r.employee_id === empId) as AssessmentRow[];
        const an = (analytics ?? []).find((r) => r.employee_id === empId) as AnalyticsRow | undefined;
        const pr = (progress ?? []).filter((r) => r.employee_id === empId) as ProgressRow[];
        const lk = (locks ?? []).filter((r) => r.employee_id === empId) as LockRow[];
        perPersona[empId] = computePersona(empId, band, competencies as CompetencyRow[], (modules ?? []) as CatalogModuleRow[], a, an, pr, lk);
      }

      // Look up persona_code per employee for persona_competency_profiles mirror.
      const { data: assignments } = await supabase
        .from("employee_persona_assignments")
        .select("employee_id, persona_code")
        .eq("account_id", accId)
        .in("employee_id", PERSONA_IDS);
      const personaCodeByEmp: Record<string, string> = {};
      for (const a of assignments ?? []) personaCodeByEmp[a.employee_id] = a.persona_code;

      // Wipe and rewrite both tables per persona.
      const accSummary: Record<string, unknown> = {};
      for (const empId of PERSONA_IDS) {
        const rows = perPersona[empId];
        await supabase.from("employee_capability_proficiency").delete().eq("account_id", accId).eq("employee_id", empId);
        const ecpInsert = rows.map((r) => ({
          account_id: accId,
          employee_id: empId,
          capability_code: r.code,
          current_level: r.level,
          source: r.source,
          confidence: r.confidence,
          short_rationale: r.rationale,
          validation_needed: r.source === "pending",
          metadata: { derived_from_journey: r.derivedFromJourney },
        }));
        const ecpRes = await supabase.from("employee_capability_proficiency").insert(ecpInsert);
        if (ecpRes.error) throw new Error(`ECP insert failed for ${empId}: ${ecpRes.error.message}`);

        // Mirror parent-only rows into persona_competency_profiles for the persona.
        const personaCode = personaCodeByEmp[empId];
        if (personaCode) {
          await supabase.from("persona_competency_profiles").delete().eq("account_id", accId).eq("persona_code", personaCode);
          const parentRows = rows.filter((r) => !r.code.includes("::"));
          const pcpInsert = parentRows.map((r) => ({
            account_id: accId,
            persona_code: personaCode,
            competency_id: r.code,
            current_level: r.level,
            confidence: r.confidence,
            short_rationale: r.rationale,
            validation_needed: r.source === "pending",
          }));
          const pcpRes = await supabase.from("persona_competency_profiles").insert(pcpInsert);
          if (pcpRes.error) throw new Error(`PCP insert failed for ${personaCode}: ${pcpRes.error.message}`);
        }

        const hist: Record<number, number> = {};
        const srcMix: Record<string, number> = {};
        let derived = 0;
        for (const r of rows) {
          hist[r.level] = (hist[r.level] ?? 0) + 1;
          srcMix[r.source] = (srcMix[r.source] ?? 0) + 1;
          if (r.derivedFromJourney) derived++;
        }
        accSummary[empId] = { rows: rows.length, derived_from_journey: derived, level_hist: hist, source_mix: srcMix };
      }
      summary[accId] = accSummary;
    }

    return new Response(JSON.stringify({ ok: true, summary }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-rathbones-persona-skills failed:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
