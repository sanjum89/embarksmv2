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

Rules:
- NEVER return empty arrays for learners, items, subjects, series, or rows — always synthesise realistic data based on context.
- NEVER use only narrative blocks for data-driven questions — pair with at least one data visual.
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
        .limit(40),
      supabase
        .from("learner_progress")
        .select("employee_id, module_code, status, assessment_score, updated_at")
        .eq("account_id", accountId),
      supabase
        .from("accounts")
        .select("name, data")
        .eq("id", accountId)
        .maybeSingle(),
    ]);

    // Build employee name lookup from account.data.employees or normalizedEmployees
    const empById: Record<string, string> = {};
    const accountData = (accountRes as any).data?.data as any;
    const employees: any[] = accountData?.employees ?? accountData?.normalizedEmployees ?? [];
    for (const e of employees) {
      if (e.id && e.name) empById[e.id] = e.name;
    }

    const modules = ((modulesRes as any).data ?? []) as any[];
    const progress = ((progressRes as any).data ?? []) as any[];
    const cohorts = ((cohortsRes as any).data ?? []) as any[];

    // Aggregate per-employee stats
    const byEmp: Record<string, { completed: number; inProgress: number; notStarted: number; scores: number[]; moduleDetails: string[] }> = {};
    for (const p of progress) {
      if (!byEmp[p.employee_id]) byEmp[p.employee_id] = { completed: 0, inProgress: 0, notStarted: 0, scores: [], moduleDetails: [] };
      const e = byEmp[p.employee_id];
      if (p.status === "completed") { e.completed++; if (p.assessment_score) e.scores.push(p.assessment_score); }
      else if (p.status === "in_progress") e.inProgress++;
      else if (p.status === "not_started") e.notStarted++;
      const mod = modules.find((m: any) => m.module_code === p.module_code);
      if (mod && p.status !== "not_started") {
        e.moduleDetails.push(`${mod.module_title}: ${p.status}${p.assessment_score ? ` (${p.assessment_score}%)` : ""}`);
      }
    }

    const learnerRows = Object.entries(byEmp).map(([id, s]) => ({
      name: empById[id] ?? id,
      modulesCompleted: s.completed,
      modulesInProgress: s.inProgress,
      avgAssessmentScore: s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : null,
      recentActivity: s.moduleDetails.slice(-4),
    }));

    const ctx = {
      account: (accountRes as any).data?.name ?? accountId,
      cohorts: cohorts.map((c: any) => c.cohort_title),
      modules: modules.map((m: any) => `${m.module_title} [${m.module_code}]`),
      learners: learnerRows,
      totalLearners: learnerRows.length,
      avgCompletion: learnerRows.length
        ? Math.round(learnerRows.reduce((a, b) => a + b.modulesCompleted, 0) / learnerRows.length * 10) / 10
        : 0,
    };

    return JSON.stringify(ctx, null, 2).slice(0, 8000);
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
        model: "gpt-4o-mini",
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
