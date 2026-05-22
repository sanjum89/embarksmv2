// Backfills realistic Rathbones-grounded chapter content into catalog_chapters
// for any chapter missing `chapter_long_form_content`. Idempotent and batched.
//
// Request body: { accountId: string, limit?: number, chapterCodes?: string[], force?: boolean }
// - accountId: required, scopes the backfill
// - limit: default 10 (chapters processed per invocation)
// - chapterCodes: optional explicit list (still respects `force`)
// - force: when true, overwrites existing long-form content
//
// Response: { processed: number, skipped: number, errors: Array<{code, error}> }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PLAYBOOK_SYSTEM = `You are writing an internal Rathbones Investment Management playbook chapter
for an Associate Investment Manager at a UK discretionary wealth manager.

GROUND TRUTH context to reference naturally (do not list as bullets):
- Charles River IMS for portfolio modelling, trading, compliance pre-trade checks
- IFL (Investment Funds List) and MPS (Managed Portfolio Service) model ranges
- IOC (Investment Office Committee) house view, asset allocation overlays
- Investment Committee notes and weekly Strategy Update
- FCA Consumer Duty, COBS suitability rules, KYC/AML workflow
- Suitability process: client objectives, capacity for loss, ATR (attitude to risk), centralised investment proposition
- Performance attribution: asset allocation effect, stock/fund selection effect, currency effect
- Real client communication style — discretionary clients expect proactive, plain-English context

Voice: senior colleague explaining how we actually do it here. Concrete. UK-regulator accurate.
British English spelling. No marketing fluff. No "in conclusion". No emoji.`;

const CISI_SYSTEM = `You are writing a CISI-style study chapter for an FCA-regulated UK wealth firm's
certifications track (CISI Investment Operations Certificate / Level 4 IAD style).

Voice: formal, exam-ready, definitional, with at least one worked example.
British English spelling. Reference UK regulators (FCA, PRA, HMRC) and UK tax wrappers
(ISA, GIA, SIPP, JISA, Onshore/Offshore Bonds) where relevant.
Structure each section like a textbook chapter section — concept, then explanation, then example.`;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    chapter_long_form_content: {
      type: "string",
      description:
        "600-900 word body. Markdown allowed (## headings, lists). No top-level # heading.",
    },
    content_sections: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          section_code: { type: "string" },
          heading: { type: "string" },
          body_md: {
            type: "string",
            description: "120-220 words of markdown.",
          },
          depth_level: {
            type: "string",
            enum: ["foundation", "core", "applied"],
          },
          tags: { type: "array", items: { type: "string" } },
          time_minutes: { type: "integer" },
        },
        required: [
          "section_code",
          "heading",
          "body_md",
          "depth_level",
          "tags",
          "time_minutes",
        ],
        additionalProperties: false,
      },
    },
    diagnostic_questions: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" },
          },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
          topic_tag: { type: "string" },
        },
        required: [
          "question",
          "options",
          "correctIndex",
          "explanation",
          "topic_tag",
        ],
        additionalProperties: false,
      },
    },
    practical_activity: {
      type: "string",
      description:
        "One concrete task (40-80 words) referencing real Rathbones systems / client situations.",
    },
    realistic_content_outline: {
      type: "string",
      description: "5-8 line bullet outline (markdown).",
    },
  },
  required: [
    "chapter_long_form_content",
    "content_sections",
    "diagnostic_questions",
    "practical_activity",
    "realistic_content_outline",
  ],
  additionalProperties: false,
};

interface ChapterRow {
  id: string;
  chapter_code: string;
  module_code: string;
  chapter_title: string;
  chapter_summary: string | null;
  learning_objective: string | null;
  topic_tags: string[] | null;
  realistic_content_outline: string | null;
  chapter_long_form_content: string | null;
}

interface ModuleRow {
  module_code: string;
  module_title: string;
  module_summary: string | null;
  learning_track_code: string;
  domain_code: string;
  role_cohort_code: string;
}

async function generateOne(
  ch: ChapterRow,
  mod: ModuleRow | undefined,
): Promise<any> {
  const isCertifications =
    (mod?.learning_track_code ?? "").toLowerCase().includes("cps") ||
    ch.chapter_code.toLowerCase().startsWith("cps") ||
    (mod?.module_code ?? "").toLowerCase().startsWith("cps");

  const system = isCertifications ? CISI_SYSTEM : PLAYBOOK_SYSTEM;

  const userPrompt = `Write the chapter content.

MODULE: ${mod?.module_title ?? ch.module_code}
${mod?.module_summary ? `MODULE SUMMARY: ${mod.module_summary}\n` : ""}CHAPTER TITLE: ${ch.chapter_title}
${ch.learning_objective ? `LEARNING OBJECTIVE: ${ch.learning_objective}\n` : ""}${ch.chapter_summary ? `CHAPTER SUMMARY (seed): ${ch.chapter_summary}\n` : ""}${ch.topic_tags?.length ? `TOPIC TAGS: ${ch.topic_tags.join(", ")}\n` : ""}${ch.realistic_content_outline ? `OUTLINE HINT:\n${ch.realistic_content_outline}\n` : ""}
Rules:
- chapter_long_form_content must be 600-900 words. Use ## sub-headings. Do NOT include a top-level # title.
- 3-5 content_sections that mirror the long-form body. Each tagged foundation / core / applied.
- 2-3 diagnostic_questions: 4 options each, correctIndex 0-3, with a topic_tag a learner could fail on.
- practical_activity is a concrete task referencing Rathbones systems where natural (Charles River, IFL, MPS, suitability, IOC house view${isCertifications ? "" : ""}). For certifications, prefer a worked exam-style problem instead.
- realistic_content_outline is a short bullet list summarising the chapter.`;

  const resp = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_chapter",
              description: "Return the structured chapter content.",
              parameters: TOOL_SCHEMA,
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "emit_chapter" },
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
  if (!call?.function?.arguments) {
    throw new Error("No tool call returned");
  }
  return JSON.parse(call.function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { accountId, limit = 10, chapterCodes, force = false } =
      await req.json();
    if (!accountId) throw new Error("accountId required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Random offset to reduce overlap when many invocations run in parallel.
    const offset = Math.floor(Math.random() * 200);
    let q = supabase
      .from("catalog_chapters")
      .select(
        "id, chapter_code, module_code, chapter_title, chapter_summary, learning_objective, topic_tags, realistic_content_outline, chapter_long_form_content",
      )
      .eq("account_id", accountId);
    if (chapterCodes?.length) {
      q = q.in("chapter_code", chapterCodes);
    } else if (!force) {
      q = q.or(
        "chapter_long_form_content.is.null,chapter_long_form_content.eq.",
      );
    }
    const { data: chapters, error: chErr } = await q
      .order("chapter_code", { ascending: true })
      .range(offset, offset + limit * 4);
    // Take only `limit` rows after the random offset — and skip any that have
    // since been filled by a concurrent invocation.
    const candidates = (chapters ?? []).filter(
      (c: any) => force || !(c.chapter_long_form_content?.trim()),
    ).slice(0, limit);
    if (chErr) throw chErr;

    const moduleCodes = Array.from(
      new Set((chapters ?? []).map((c) => c.module_code)),
    );
    const { data: modules } = await supabase
      .from("catalog_modules")
      .select(
        "module_code, module_title, module_summary, learning_track_code, domain_code, role_cohort_code",
      )
      .eq("account_id", accountId)
      .in("module_code", moduleCodes);
    const modMap = new Map(
      (modules ?? []).map((m) => [m.module_code, m as ModuleRow]),
    );

    let processed = 0;
    let skipped = 0;
    const errors: Array<{ code: string; error: string }> = [];

    for (const ch of chapters ?? []) {
      try {
        if (!force && ch.chapter_long_form_content?.trim()) {
          skipped++;
          continue;
        }
        const out = await generateOne(ch as ChapterRow, modMap.get(ch.module_code));
        const sections = (out.content_sections ?? []).map(
          (s: any, i: number) => ({
            section_code: s.section_code || `${ch.chapter_code}-s${i + 1}`,
            heading: s.heading,
            body_md: s.body_md,
            depth_level: s.depth_level,
            tags: s.tags ?? [],
            time_minutes: s.time_minutes ?? 5,
          }),
        );
        const questions = (out.diagnostic_questions ?? []).map((q: any) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          tags: q.topic_tag ? [q.topic_tag] : [],
        }));
        const { error: upErr } = await supabase
          .from("catalog_chapters")
          .update({
            chapter_long_form_content: out.chapter_long_form_content,
            content_sections: sections,
            diagnostic_questions: questions,
            practical_activity: out.practical_activity,
            realistic_content_outline: out.realistic_content_outline,
          })
          .eq("id", ch.id);
        if (upErr) throw upErr;
        processed++;
      } catch (e: any) {
        errors.push({ code: ch.chapter_code, error: e?.message ?? String(e) });
      }
    }

    return new Response(
      JSON.stringify({ processed, skipped, errors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    console.error("generate-catalog-chapters error", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
