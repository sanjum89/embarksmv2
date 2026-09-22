// Generates post-assessment micro-learnings for wrong answers.
// Called after an assessment submission with score < 100.
//
// Request body:
// {
//   accountId, cohortId, employeeId,
//   sourceAssessmentId,         // uuid in assessment_instances (optional but recommended)
//   moduleCode?: string,
//   wrongAnswers: Array<{
//      question: string,
//      learnerAnswer: string,
//      correctAnswer: string,
//      topicTag?: string,
//      chapterCodes?: string[],
//   }>
// }
//
// Response: { created: number, microLearningIds: string[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    why_wrong: {
      type: "string",
      description:
        "1-2 sentences explaining the misconception the learner held.",
    },
    teaching_content_outline: {
      type: "string",
      description:
        "300-500 words of plain-English remediation in Markdown, written as an internal Rathbones playbook. Use ## sub-headings.",
    },
    practical_activity: {
      type: "string",
      description:
        "One concrete 3-5 minute task the learner can do at their desk (e.g. on Charles River, IFL, MPS, a sample client note).",
    },
  },
  required: ["why_wrong", "teaching_content_outline", "practical_activity"],
  additionalProperties: false,
};

async function generateOne(
  q: any,
  moduleCode: string | undefined,
): Promise<any> {
  const resp = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You author short focused micro-learnings for Associate Investment Managers at Rathbones (UK discretionary wealth).
Voice: senior colleague. British English. Reference Charles River IMS, IFL/MPS model ranges, IOC house view, COBS, Consumer Duty, suitability process where natural.
No marketing fluff, no emoji. 3-5 minute remediation aimed at the specific misconception.`,
          },
          {
            role: "user",
            content: `Module: ${moduleCode ?? "(unspecified)"}
Topic: ${q.topicTag ?? "(unspecified)"}
Failed question: ${q.question}
Learner answered: ${q.learnerAnswer}
Correct answer: ${q.correctAnswer}

Write a focused micro-learning that closes the specific gap shown by their wrong answer.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_micro_learning",
              description: "Return the structured micro-learning content.",
              parameters: TOOL_SCHEMA,
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "emit_micro_learning" },
        },
      }),
    },
  );
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${txt.slice(0, 400)}`);
  }
  const json = await resp.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("No tool call returned");
  return JSON.parse(call.function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const {
      accountId,
      cohortId,
      employeeId,
      sourceAssessmentId,
      moduleCode,
      wrongAnswers,
      kind,
      maxItems,
    } = await req.json();
    if (!accountId || !employeeId || !Array.isArray(wrongAnswers)) {
      throw new Error("accountId, employeeId, wrongAnswers required");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { db: { schema: 'embarksmv2' } });

    // Group wrong answers by topic_tag so we make ONE micro-learning per weak topic.
    const groups = new Map<string, any[]>();
    for (const w of wrongAnswers) {
      const key = (w.topicTag ?? w.question).toString().slice(0, 80);
      const arr = groups.get(key) ?? [];
      arr.push(w);
      groups.set(key, arr);
    }

    const created: string[] = [];
    const itemKind = kind === "gap_module" ? "gap_module" : "micro_learning";
    const cap = Number.isFinite(maxItems) ? Number(maxItems) : Infinity;

    for (const [topic, items] of groups.entries()) {
      if (created.length >= cap) break;
      const representative = items[0];
      try {
        const out = await generateOne(representative, moduleCode);
        const chapterCodes = Array.from(
          new Set(items.flatMap((i) => i.chapterCodes ?? [])),
        );
        const { data: inserted, error: insErr } = await supabase
          .from("micro_learnings")
          .insert({
            account_id: accountId,
            cohort_id: cohortId ?? null,
            employee_id: employeeId,
            source_assessment_id: sourceAssessmentId ?? null,
            module_code: moduleCode ?? null,
            topic_tag: topic,
            failed_question: representative.question,
            learner_answer: representative.learnerAnswer ?? null,
            correct_answer: representative.correctAnswer ?? null,
            why_wrong: out.why_wrong,
            teaching_content_outline: out.teaching_content_outline,
            practical_activity: out.practical_activity,
            chapters: chapterCodes,
            kind: itemKind,
            status: "pending",
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        if (inserted?.id) created.push(inserted.id);
      } catch (e) {
        console.error("micro-learning generation failed", topic, e);
      }
    }

    // Bump learner_analytics.total_micro_learnings (best effort)
    if (created.length > 0) {
      const { data: a } = await supabase
        .from("learner_analytics")
        .select("id, total_micro_learnings")
        .eq("account_id", accountId)
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (a?.id) {
        await supabase
          .from("learner_analytics")
          .update({
            total_micro_learnings:
              (a.total_micro_learnings ?? 0) + created.length,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", a.id);
      } else {
        await supabase.from("learner_analytics").insert({
          account_id: accountId,
          cohort_id: cohortId ?? null,
          employee_id: employeeId,
          total_micro_learnings: created.length,
          last_activity_at: new Date().toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({ created: created.length, microLearningIds: created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("generate-micro-learning error", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
