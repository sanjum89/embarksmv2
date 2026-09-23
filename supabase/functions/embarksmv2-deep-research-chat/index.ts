// Deep Research — live engine. Returns a ResponseEnvelope JSON.
// For Rathbones / Pinnacle the client short-circuits with scripted showcase data;
// this function handles every other prompt by (1) pulling real learner/cohort data
// from Supabase and (2) calling OpenAI with that data as grounding context.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You are Deep Research — a BI-style analyst for managers and cohort leaders in a workplace learning platform.

Always respond by calling the render_answer function. Never reply with free text.

Your output envelope:
- executive: 1–2 sentence headline finding (always present, plain English)
- visuals: array of 1+ visual blocks — use the EXACT field names shown in VISUAL BLOCK SCHEMAS below
- evidence: list of {label, source, value?}; cite tools/data the conclusion rests on
- actions: 0–4 typed action chips with id ∈ {assign_module, assign_skill_target, schedule_1on1, send_check_in, request_reflection, assign_mentor, assign_evidence_task, flag_risk_critical, generate_readiness_pack}
- followups: 2–4 short follow-up questions
- trace: short list of synthetic tool calls that show your reasoning

VISUAL BLOCK SCHEMAS — use EXACTLY these field names, never invent alternatives:

kpi_strip:
  { "type": "kpi_strip", "items": [{ "label": "Avg Readiness", "value": "72%", "tone": "amber", "sub": "vs 80% target" }] }
  tone values: "green" | "amber" | "red" | "neutral"

readiness_cards:
  { "type": "readiness_cards", "learners": [{ "name": "Alice Chen", "title": "Associate IM", "status": "On Track", "statusTone": "green", "topGap": "Portfolio Construction", "nextAction": "Complete TK3 assessment" }] }
  statusTone values: "green" | "amber" | "red". Always include 3–6 learners.

competency_radar:
  { "type": "competency_radar", "subjects": ["Client Comms", "Risk Mgmt", "Portfolio Construction", "Compliance", "Technical Tools"], "series": [{ "name": "Cohort Avg", "values": [75, 60, 45, 80, 65], "tone": "primary" }, { "name": "Target", "values": [80, 80, 80, 80, 80], "tone": "muted" }] }
  subjects and series[].values must have the same length. tone: "primary" | "accent" | "muted"

module_adaptation:
  { "type": "module_adaptation", "learners": [{ "name": "Alice Chen", "segments": [{ "label": "Full", "count": 4 }, { "label": "Condensed", "count": 2 }] }] }
  label values: "Full" | "Condensed" | "Diagnostic" | "Evidence-only" | "Already covered"

risk_matrix:
  { "type": "risk_matrix", "competencies": ["Risk Mgmt", "Compliance", "Client Comms"], "learners": [{ "name": "Alice Chen", "cells": [{ "competency": "Risk Mgmt", "status": "red", "note": "No evidence submitted" }] }] }
  status values: "green" | "amber" | "red". Each learner.cells entry must match a competency in the competencies array.

action_board:
  { "type": "action_board", "columns": [{ "title": "High", "cards": [{ "learner": "Alice Chen", "action": "Assign TK3 module", "why": "3 weeks behind on performance attribution", "actionId": "assign_module" }] }, { "title": "Medium", "cards": [] }, { "title": "Low", "cards": [] }] }
  title values: "High" | "Medium" | "Low". Always include all 3 columns.

evidence_table:
  { "type": "evidence_table", "columns": ["Learner", "Module", "Score", "Status"], "rows": [["Alice Chen", "TK3", "72%", "In Progress"]] }

narrative:
  { "type": "narrative", "markdown": "## Summary\nContent here..." }

learner_list:
  { "type": "learner_list", "ids": ["Alice Chen", "Bob Smith"], "subtitle": "At-risk learners" }

RESPONSE RULES:
- Always generate 3 or more visual blocks per answer. Typical pattern: kpi_strip → readiness_cards → narrative.
- The narrative block MUST contain analytical synthesis: WHY the numbers look this way, WHAT the manager should prioritise, and HOW to act. Write it in bold-lead markdown.
- Populate ALL arrays from the live data provided. Every learner name, score, and module title must come from the data — do not invent names or figures not present.
- Evidence sources: use labels like "tool:cohort_data", "tool:module_progress", "tool:learner_signals", "tool:assessment_results" as source values.
- For readiness_cards statusTone: on_track→"green", needs_support→"amber", at_risk→"red".
- For kpi_strip, always include: cohort avg completion %, count on track, count at risk, count stretch-ready.
- If asked about a specific learner, include a competency_radar comparing them to the cohort target.
- If asked about module format differences, include module_adaptation AND competency_radar AND a narrative explaining why paths differ.
- NEVER return empty arrays — if data is sparse, synthesise intelligently from what is present.
- If you are given lastEnvelopeContext, ground your new answer in those facts.
- If asked to DRAFT a message, the FIRST visual MUST be a narrative block with the full written message.

Tone: crisp, executive, evidence-led. No hedging, no apologies.`;

const RENDER_ANSWER_TOOL = {
  type: "function",
  function: {
    name: "render_answer",
    description: "Render the structured Deep Research envelope.",
    parameters: {
      type: "object",
      properties: {
        executive: { type: "string" },
        visuals: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
        evidence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              source: { type: "string" },
              value: { type: "string" },
            },
            required: ["label", "source"],
          },
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              payload: { type: "object", additionalProperties: true },
              confirm: { type: "boolean" },
            },
            required: ["id", "label", "payload"],
          },
        },
        followups: { type: "array", items: { type: "string" } },
        trace: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tool: { type: "string" },
              args: { type: "object", additionalProperties: true },
              rows: { type: "number" },
              ms: { type: "number" },
              note: { type: "string" },
            },
            required: ["tool"],
          },
        },
      },
      required: ["executive", "visuals", "evidence", "actions", "followups", "trace"],
      additionalProperties: false,
    },
  },
};

/** Pull a compact snapshot of the account's cohort + learner data for AI grounding. */
async function buildDataContext(accountId: string): Promise<string> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: "embarksmv2" },
    });

    const [cohortsRes, modulesRes, progressRes, accountRes] = await Promise.all([
      supabase
        .from("cohorts")
        .select("cohort_code, cohort_title, role_cohort_code, start_date, due_date")
        .eq("account_id", accountId)
        .neq("status", "archived")
        .limit(10),
      supabase
        .from("catalog_modules")
        .select("module_code, module_title, track_code, display_order")
        .eq("account_id", accountId)
        .order("display_order")
        .limit(60),
      supabase
        .from("learner_progress")
        .select("employee_id, module_code, status, assessment_score")
        .eq("account_id", accountId),
      supabase
        .from("accounts")
        .select("name, data")
        .eq("id", accountId)
        .maybeSingle(),
    ]);

    // Build employee name/title lookup
    const empById: Record<string, { name: string; title: string }> = {};
    const accountData = (accountRes as any).data?.data as any;
    const employees: any[] = accountData?.employees ?? accountData?.normalizedEmployees ?? [];
    for (const e of employees) {
      if (e.id && e.name) empById[e.id] = { name: e.name, title: e.title ?? "Associate IM" };
    }

    const modules = ((modulesRes as any).data ?? []) as any[];
    const progress = ((progressRes as any).data ?? []) as any[];
    const cohorts = ((cohortsRes as any).data ?? []) as any[];
    const totalModules = modules.length;

    // Module lookup by code
    const modMap: Record<string, { title: string; track: string }> = {};
    for (const m of modules) modMap[m.module_code] = { title: m.module_title, track: m.track_code };

    // Track display names (derive from track_code)
    const trackNames: Record<string, string> = {};
    for (const m of modules) {
      if (!trackNames[m.track_code]) trackNames[m.track_code] = m.track_code;
    }

    // Per-employee detail
    type EmpData = {
      completed: { title: string; track: string; score?: number }[];
      inProgress: { title: string; track: string; score?: number }[];
      locked: string[];
    };
    const byEmp: Record<string, EmpData> = {};
    for (const p of progress) {
      if (!byEmp[p.employee_id]) byEmp[p.employee_id] = { completed: [], inProgress: [], locked: [] };
      const mod = modMap[p.module_code];
      if (!mod) continue;
      if (p.status === "completed") {
        byEmp[p.employee_id].completed.push({ title: mod.title, track: mod.track, score: p.assessment_score ?? undefined });
      } else if (p.status === "in_progress") {
        byEmp[p.employee_id].inProgress.push({ title: mod.title, track: mod.track, score: p.assessment_score ?? undefined });
      } else if (p.status === "locked") {
        byEmp[p.employee_id].locked.push(mod.title);
      }
    }

    // Build rich learner summaries
    const learners = Object.entries(byEmp).map(([id, d]) => {
      const completionPct = totalModules > 0 ? Math.round((d.completed.length / totalModules) * 100) : 0;
      const scores = d.completed.filter(m => m.score != null).map(m => m.score!);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      // Identify top gap track (track with most in-progress modules)
      const gapTracks: Record<string, number> = {};
      for (const m of d.inProgress) gapTracks[m.track] = (gapTracks[m.track] ?? 0) + 1;
      const topGapEntry = Object.entries(gapTracks).sort((a, b) => b[1] - a[1])[0];
      const topGap = topGapEntry ? `${topGapEntry[0]} (${topGapEntry[1]} module${topGapEntry[1] > 1 ? "s" : ""} in progress)` : "None";

      // Status: at_risk if <30% done, needs_support if <60%, on_track otherwise
      const status = completionPct >= 60 ? "on_track" : completionPct >= 30 ? "needs_support" : "at_risk";

      return {
        name: empById[id]?.name ?? id,
        title: empById[id]?.title ?? "Associate IM",
        completionPct,
        modulesCompleted: d.completed.length,
        modulesInProgress: d.inProgress.length,
        totalModules,
        avgScore,
        status,
        topGap,
        completedModules: d.completed.map(m => `${m.title}${m.score != null ? ` [${m.score}%]` : ""}`),
        inProgressModules: d.inProgress.map(m => `${m.title}${m.score != null ? ` [${m.score}%]` : ""}`),
      };
    });

    // Cohort-level aggregates
    const onTrack = learners.filter(l => l.status === "on_track");
    const atRisk = learners.filter(l => l.status === "at_risk");
    const needsSupport = learners.filter(l => l.status === "needs_support");
    const avgCompletion = learners.length
      ? Math.round(learners.reduce((a, b) => a + b.completionPct, 0) / learners.length)
      : 0;

    // Track-level completion summary
    const trackStats: Record<string, { completed: number; inProgress: number; total: number }> = {};
    for (const m of modules) {
      if (!trackStats[m.track_code]) trackStats[m.track_code] = { completed: 0, inProgress: 0, total: 0 };
      trackStats[m.track_code].total++;
    }
    for (const p of progress) {
      const mod = modMap[p.module_code];
      if (!mod) continue;
      if (!trackStats[mod.track]) continue;
      if (p.status === "completed") trackStats[mod.track].completed++;
      else if (p.status === "in_progress") trackStats[mod.track].inProgress++;
    }

    // Top blockers: modules most commonly in-progress/not completed
    const moduleBlockCounts: Record<string, number> = {};
    for (const p of progress) {
      if (p.status === "in_progress" || p.status === "not_started") {
        const mod = modMap[p.module_code];
        if (mod) moduleBlockCounts[mod.title] = (moduleBlockCounts[mod.title] ?? 0) + 1;
      }
    }
    const topBlockers = Object.entries(moduleBlockCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, count]) => `${title} (${count} learner${count > 1 ? "s" : ""})`);

    const ctx = {
      account: (accountRes as any).data?.name ?? accountId,
      cohorts: cohorts.map((c: any) => c.cohort_title),
      totalLearners: learners.length,
      avgCompletionPct: avgCompletion,
      onTrackCount: onTrack.length,
      onTrackNames: onTrack.map(l => l.name),
      atRiskCount: atRisk.length,
      atRiskNames: atRisk.map(l => l.name),
      needsSupportCount: needsSupport.length,
      needsSupportNames: needsSupport.map(l => l.name),
      topBlockers,
      trackSummary: Object.entries(trackStats).map(([code, s]) => ({
        track: code,
        completedModules: s.completed,
        inProgressModules: s.inProgress,
        totalModules: s.total,
        completionPct: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      })),
      learners,
    };

    return JSON.stringify(ctx, null, 2).slice(0, 12000);
  } catch (e) {
    console.warn("buildDataContext failed", e);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prompt, accountId, accountName, history = [], lastEnvelopeContext = null } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    // Pull live cohort data if we have an accountId
    const dataContext = accountId ? await buildDataContext(accountId) : "";

    const contextMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Active account: ${accountName ?? "unknown"}.` },
    ];

    if (dataContext) {
      contextMessages.push({
        role: "system",
        content: `Live data for this account (use this as the authoritative source for all learner names, scores, and progress — do not invent data not present here):\n${dataContext}`,
      });
    }

    if (lastEnvelopeContext) {
      contextMessages.push({
        role: "system",
        content: `Previous answer context (ground new answers in these facts when relevant):\n${JSON.stringify(lastEnvelopeContext).slice(0, 4000)}`,
      });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [...contextMessages, ...history.slice(-6), { role: "user", content: prompt }],
        tools: [RENDER_ANSWER_TOOL],
        tool_choice: { type: "function", function: { name: "render_answer" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Model did not return an envelope" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const envelope = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ envelope }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("deep-research-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
