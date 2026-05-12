// Deep Research — live engine fallback. Returns a ResponseEnvelope JSON.
// For Rathbones / Pinnacle the client short-circuits with scripted showcase data;
// this function handles every other prompt by calling Lovable AI with a tool-call
// schema that forces the structured envelope.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `You are Deep Research — a BI-style analyst for managers and cohort leaders in a workplace learning platform.

Always respond by calling the render_answer function. Never reply with free text.

Your output envelope:
- executive: 1–2 sentence headline finding (always present, plain English)
- visuals: array of 1+ visual blocks. Choose appropriate types: kpi_strip, readiness_cards, competency_radar, module_adaptation, risk_matrix, action_board, evidence_table, narrative, learner_list. NEVER respond with only narrative blocks if the question is data-driven.
- evidence: list of {label, source, value?}; cite tools/data the conclusion rests on
- actions: 0–4 typed action chips with id ∈ {assign_module, assign_skill_target, schedule_1on1, send_check_in, request_reflection, assign_mentor, assign_evidence_task, flag_risk_critical, generate_readiness_pack}
- followups: 2–4 short follow-up questions
- trace: short list of synthetic tool calls that show your reasoning

Special handling:
- If the user asks you to DRAFT a message, email, or note to a named learner, the FIRST visual MUST be a "narrative" block containing the fully written message itself (subject line + body, signed). Do not describe how to draft it; write it. Add an evidence_table block listing the facts you used.
- If you are given lastEnvelopeContext (the previous answer's executive + evidence), ground your new answer in those facts so the conversation stays coherent.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prompt, accountName, history = [], lastEnvelopeContext = null } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Active account: ${accountName ?? "unknown"}.` },
    ];
    if (lastEnvelopeContext) {
      contextMessages.push({
        role: "system",
        content: `Previous answer context (ground new answers in these facts when relevant):\n${JSON.stringify(lastEnvelopeContext).slice(0, 4000)}`,
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
