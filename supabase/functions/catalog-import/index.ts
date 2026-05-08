// catalog-import: expands the hand-authored skeleton into rich prose via
// Lovable AI (google/gemini-2.5-pro) and upserts into the catalog tables.
//
// POST { accountId: string, moduleCodes?: string[], dryRun?: boolean }
//
// Idempotent: re-running upserts by (account_id, code) keys.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SKELETON_MODULES, type ModuleSkeleton } from "./skeleton.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ───────── Tool schema returned by AI for each module ─────────
function buildToolSchema(skel: ModuleSkeleton) {
  return {
    type: "function",
    function: {
      name: "fill_module_prose",
      description:
        "Return rich, Rathbones-tone prose for an Associate IM learning module skeleton. Original wording — do NOT quote CISI material verbatim.",
      parameters: {
        type: "object",
        properties: {
          module_summary: { type: "string", description: "120-180 word overview of the module." },
          remediation_recommendation: { type: "string", description: "What to do if a learner fails this module's gate." },
          stretch_recommendation: { type: "string", description: "Stretch path for high performers after this module." },
          manager_conversation_prompt: { type: "string", description: "1-2 sentence prompt the manager can use in 1:1." },
          behavioural_indicators: { type: "array", items: { type: "string" }, description: "3-5 observable behaviours indicating mastery." },
          business_impact_indicators: { type: "array", items: { type: "string" }, description: "3-5 business outcomes indicating mastery." },
          chapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                chapter_code: { type: "string" },
                chapter_summary: { type: "string", description: "60-90 words." },
                realistic_content_outline: { type: "string", description: "Bulleted realistic content outline, 120-200 words. Use markdown bullets." },
                practical_activity: { type: "string", description: "A realistic synthetic activity (60-100 words)." },
                reflection_prompt: { type: "string", description: "1-2 reflection questions." },
              },
              required: ["chapter_code", "chapter_summary", "realistic_content_outline", "practical_activity", "reflection_prompt"],
              additionalProperties: false,
            },
          },
          blueprints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                blueprint_code: { type: "string" },
                assessment_summary: { type: "string", description: "60-100 words." },
                pass_criteria: { type: "string", description: "What 80% looks like." },
                distinction_criteria: { type: "string", description: "What 100% looks like." },
                realistic_synthetic_prompt_or_scenario: { type: "string", description: "Realistic synthetic scenario the learner sees, 100-180 words." },
                remediation_if_failed: { type: "string", description: "What to do if score is below pass." },
              },
              required: ["blueprint_code", "assessment_summary", "pass_criteria", "distinction_criteria", "realistic_synthetic_prompt_or_scenario", "remediation_if_failed"],
              additionalProperties: false,
            },
          },
          evidence_tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                evidence_task_code: { type: "string" },
                evidence_description: { type: "string", description: "60-100 words." },
                quality_indicators: { type: "array", items: { type: "string" }, description: "4-6 indicators of good evidence." },
                example_synthetic_evidence_summary: { type: "string", description: "What a strong synthetic submission looks like (80-140 words)." },
              },
              required: ["evidence_task_code", "evidence_description", "quality_indicators", "example_synthetic_evidence_summary"],
              additionalProperties: false,
            },
          },
        },
        required: ["module_summary", "remediation_recommendation", "stretch_recommendation", "manager_conversation_prompt", "behavioural_indicators", "business_impact_indicators", "chapters", "blueprints", "evidence_tasks"],
        additionalProperties: false,
      },
    },
  };
}

async function expandModule(skel: ModuleSkeleton): Promise<any> {
  const skeletonForPrompt = {
    module_code: skel.module_code,
    module_title: skel.module_title,
    track: skel.learning_track_code,
    target_capabilities: skel.target_capabilities,
    difficulty: skel.difficulty_level,
    is_stretch: skel.is_stretch_module,
    chapters: skel.chapters.map((c) => ({
      chapter_code: c.chapter_code,
      chapter_title: c.chapter_title,
      learning_objective: c.learning_objective,
      content_type: c.content_type,
      topic_tags: c.topic_tags,
    })),
    blueprints: skel.blueprints.map((b) => ({
      blueprint_code: b.blueprint_code,
      title: b.assessment_title,
      type: b.assessment_type,
      scope: b.scope,
      topic_outline: b.topic_outline,
    })),
    evidence_tasks: skel.evidence_tasks.map((e) => ({
      evidence_task_code: e.evidence_task_code,
      evidence_title: e.evidence_title,
      evidence_type: e.evidence_type,
      reviewer_role: e.reviewer_role,
    })),
  };

  const sysPrompt = `You are a senior learning designer building the Rathbones Institute curriculum for Associate Investment Managers in UK wealth management. Tone: precise, professional, plainspoken, FCA-aware, never patronising. All content must be realistic but synthetic — never quote CISI, FCA, or Rathbones material verbatim. Use UK English. Always ground examples in discretionary wealth management practice.`;

  const userPrompt = `Expand this module skeleton with rich, original prose. Keep the codes EXACTLY as given.\n\n${JSON.stringify(skeletonForPrompt, null, 2)}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [buildToolSchema(skel)],
      tool_choice: { type: "function", function: { name: "fill_module_prose" } },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI call failed for ${skel.module_code}: ${resp.status} ${txt.slice(0, 300)}`);
  }
  const json = await resp.json();
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error(`No tool_call args for ${skel.module_code}`);
  return JSON.parse(args);
}

async function upsertByCode(
  table: string,
  accountId: string,
  codeColumn: string,
  code: string,
  row: Record<string, any>,
) {
  const { data: existing, error: selErr } = await sb
    .from(table)
    .select("id")
    .eq("account_id", accountId)
    .eq(codeColumn, code)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await sb.from(table).update(row).eq("id", existing.id);
    if (error) throw error;
    return { action: "update", id: existing.id };
  }
  const { data, error } = await sb
    .from(table)
    .insert({ ...row, account_id: accountId, [codeColumn]: code })
    .select("id")
    .single();
  if (error) throw error;
  return { action: "insert", id: data.id };
}

async function importModule(accountId: string, skel: ModuleSkeleton, dryRun: boolean) {
  const ai = await expandModule(skel);

  if (dryRun) {
    return { module_code: skel.module_code, prose_keys: Object.keys(ai) };
  }

  // Module
  await upsertByCode("catalog_modules", accountId, "module_code", skel.module_code, {
    module_title: skel.module_title,
    domain_code: skel.domain_code,
    role_cohort_code: skel.role_cohort_code,
    learning_track_code: skel.learning_track_code,
    progression_stage: skel.progression_stage,
    module_summary: ai.module_summary,
    target_capabilities: skel.target_capabilities,
    estimated_effort_hours: skel.estimated_effort_hours,
    difficulty_level: skel.difficulty_level,
    prerequisite_module_codes: skel.prerequisite_module_codes,
    is_core_required: skel.is_core_required,
    is_stretch_module: skel.is_stretch_module,
    stretch_target_role_cohort: skel.stretch_target_role_cohort,
    recommended_delivery_mode: skel.recommended_delivery_mode,
    remediation_recommendation: ai.remediation_recommendation,
    stretch_recommendation: ai.stretch_recommendation,
    nudge_trigger_tags: skel.nudge_trigger_tags,
    stretch_unlock_conditions: skel.stretch_unlock_conditions,
    risk_flags_if_not_completed: skel.risk_flags_if_not_completed,
    manager_conversation_prompt: ai.manager_conversation_prompt,
    display_order: skel.display_order,
    is_shell: false,
    metadata: {
      behavioural_indicators: ai.behavioural_indicators,
      business_impact_indicators: ai.business_impact_indicators,
    },
  });

  // Chapters
  for (let i = 0; i < skel.chapters.length; i++) {
    const c = skel.chapters[i];
    const aiC = (ai.chapters || []).find((x: any) => x.chapter_code === c.chapter_code) || {};
    await upsertByCode("catalog_chapters", accountId, "chapter_code", c.chapter_code, {
      module_code: skel.module_code,
      chapter_title: c.chapter_title,
      chapter_summary: aiC.chapter_summary || "",
      learning_objective: c.learning_objective,
      content_type: c.content_type,
      estimated_time_minutes: c.estimated_time_minutes,
      difficulty_level: c.difficulty_level,
      delivery_mode: c.delivery_mode,
      realistic_content_outline: aiC.realistic_content_outline || "",
      practical_activity: aiC.practical_activity || "",
      reflection_prompt: aiC.reflection_prompt || "",
      related_capabilities: c.related_capabilities,
      topic_tags: c.topic_tags,
      complexity: c.complexity,
      display_order: (i + 1) * 10,
    });
  }

  // Blueprints
  for (let i = 0; i < skel.blueprints.length; i++) {
    const b = skel.blueprints[i];
    const aiB = (ai.blueprints || []).find((x: any) => x.blueprint_code === b.blueprint_code) || {};
    await upsertByCode("catalog_assessment_blueprints", accountId, "blueprint_code", b.blueprint_code, {
      module_code: skel.module_code,
      chapter_code: b.chapter_code || null,
      scope: b.scope,
      assessment_type: b.assessment_type,
      assessment_title: b.assessment_title,
      assessment_summary: aiB.assessment_summary || "",
      pass_criteria: aiB.pass_criteria || "",
      distinction_criteria: aiB.distinction_criteria || "",
      passing_score: b.passing_score ?? 80,
      scoring_dimensions: b.scoring_dimensions,
      realistic_synthetic_prompt_or_scenario: aiB.realistic_synthetic_prompt_or_scenario || "",
      remediation_if_failed: aiB.remediation_if_failed || "",
      evidence_generated: b.evidence_generated,
      topic_outline: b.topic_outline,
      display_order: (i + 1) * 10,
    });
  }

  // Evidence tasks
  for (let i = 0; i < skel.evidence_tasks.length; i++) {
    const e = skel.evidence_tasks[i];
    const aiE = (ai.evidence_tasks || []).find((x: any) => x.evidence_task_code === e.evidence_task_code) || {};
    await upsertByCode("catalog_evidence_tasks", accountId, "evidence_task_code", e.evidence_task_code, {
      module_code: skel.module_code,
      evidence_title: e.evidence_title,
      evidence_description: aiE.evidence_description || "",
      evidence_type: e.evidence_type,
      required_for_gate: e.required_for_gate,
      reviewer_role: e.reviewer_role,
      submission_format: e.submission_format,
      quality_indicators: aiE.quality_indicators || [],
      example_synthetic_evidence_summary: aiE.example_synthetic_evidence_summary || "",
      display_order: (i + 1) * 10,
    });
  }

  // Gate requirements (module-level link only; chapter/blueprint/evidence-level optional)
  for (const gate of skel.contributes_to_gates) {
    const requirementCode = `${gate}::${skel.module_code}`;
    await upsertByCode("catalog_gate_requirements", accountId, "requirement_code", requirementCode, {
      gate_code: gate,
      requirement_kind: "module",
      notes: null,
    });
  }

  return { module_code: skel.module_code, ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { accountId, moduleCodes, dryRun } = await req.json();
    if (!accountId) {
      return new Response(JSON.stringify({ error: "accountId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targets = moduleCodes && moduleCodes.length
      ? SKELETON_MODULES.filter((m) => moduleCodes.includes(m.module_code))
      : SKELETON_MODULES;

    const results: any[] = [];
    const errors: any[] = [];

    for (const skel of targets) {
      try {
        const r = await importModule(accountId, skel, !!dryRun);
        results.push(r);
      } catch (e: any) {
        console.error(`Module ${skel.module_code} failed:`, e?.message);
        errors.push({ module_code: skel.module_code, error: String(e?.message || e) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: results.length, results, errors, dryRun: !!dryRun }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("catalog-import error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
