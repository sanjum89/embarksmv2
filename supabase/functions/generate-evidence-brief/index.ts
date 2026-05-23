import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BriefRequest {
  moduleCode: string;
  moduleTitle: string;
  evidenceTitle: string;
  evidenceDescription?: string | null;
  qualityIndicators?: string[];
  submissionFormat?: string;
  accountName?: string;
}

const SYSTEM = `You are a learning designer for a UK wealth-management firm.
You generate the ACTUAL task material a learner has to work on for an "evidence" submission — not instructions, but the real synthetic case / scenario / data pack they will respond to.

Adapt the shape of the brief to the submission format:
- "written" with suitability/IM/wealth context → a complete synthetic Private Client pack (name, age, occupation, family, total investable assets, income, objectives, time horizon, ATR rating + score, CFL rating, constraints, ethical preferences, tax wrapper context, urgency).
- meeting prep / file note → a meeting context (attendees, agenda, prior notes).
- ops / process / corporate-actions → a case file or system record needing action.

The scenario MUST be vivid, specific, plausibly UK-based, with concrete numbers and dates.
Return STRICT JSON only — no prose, no markdown — matching:
{
  "scenarioTitle": string,
  "contextParagraph": string,             // 2-4 sentences setting the scene
  "sections": [
    { "heading": string, "bullets": string[] }   // OR { "heading": string, "body": string }
  ],
  "keyFigures": [ { "label": string, "value": string } ],   // optional 3-6 items
  "promptToLearner": string               // single sentence telling them what to produce
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as BriefRequest;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firmName = body.accountName || "Rathbones";
    const userPrompt = `Firm: ${firmName}
Module: ${body.moduleTitle} (${body.moduleCode})
Evidence task: ${body.evidenceTitle}
What the learner has to do: ${body.evidenceDescription ?? "(not specified — infer from the title)"}
Submission format: ${body.submissionFormat ?? "written"}
Quality indicators they'll be judged on:
${(body.qualityIndicators ?? []).map((q) => `- ${q}`).join("\n") || "- (none provided)"}

Generate the brief now. JSON only.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let brief: unknown;
    try {
      brief = JSON.parse(content);
    } catch {
      brief = { scenarioTitle: body.evidenceTitle, contextParagraph: content, sections: [] };
    }

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
