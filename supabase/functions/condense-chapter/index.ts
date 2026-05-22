// Returns a persona-specific *condensed rewrite* of a chapter.
// - Caches result in catalog_chapters.condensed_by_persona[personaCode].
// - On cache hit returns the stored body without calling the AI.
//
// Request: { accountId, chapterCode, personaCode, force?: boolean }
// Response: { body: string, cached: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { accountId, chapterCode, personaCode, force = false } =
      await req.json();
    if (!accountId || !chapterCode || !personaCode) {
      throw new Error("accountId, chapterCode, personaCode required");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: ch, error: chErr } = await supabase
      .from("catalog_chapters")
      .select(
        "id, chapter_title, chapter_long_form_content, content_sections, practical_activity, condensed_by_persona",
      )
      .eq("account_id", accountId)
      .eq("chapter_code", chapterCode)
      .maybeSingle();
    if (chErr) throw chErr;
    if (!ch) throw new Error("chapter not found");

    const cache = (ch.condensed_by_persona as Record<string, string>) ?? {};
    if (!force && typeof cache[personaCode] === "string" && cache[personaCode].length > 200) {
      return new Response(
        JSON.stringify({ body: cache[personaCode], cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Persona context: pull competency profile so AI knows what to compress.
    const { data: profile } = await supabase
      .from("persona_competency_profiles")
      .select("competency_id, current_level, confidence")
      .eq("account_id", accountId)
      .eq("persona_code", personaCode);

    const evidenced = (profile ?? [])
      .filter((p) => (p.current_level ?? 0) >= 3)
      .map((p) => p.competency_id);

    const fullBody = ch.chapter_long_form_content?.trim();
    if (!fullBody || fullBody.length < 200) {
      throw new Error(
        "chapter has no long-form content yet — run generate-catalog-chapters first",
      );
    }

    const targetWords = evidenced.length >= 5 ? 280 : 380;

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
            {
              role: "system",
              content:
                `You are condensing a Rathbones internal playbook chapter for a specific learner.
Keep applied UK wealth-management examples in full (Charles River, IFL/MPS, IOC house view, COBS, Consumer Duty).
Drop or compress basics the learner already evidences. Keep the same voice as the original.
Output Markdown only. Use 2-3 ## headings. ~${targetWords} words. No top-level # heading.`,
            },
            {
              role: "user",
              content: `CHAPTER: ${ch.chapter_title}
LEARNER ALREADY EVIDENCES (skip basics on these competencies): ${evidenced.join(", ") || "(none specifically)"}

FULL CHAPTER:
${fullBody}

${ch.practical_activity ? `PRACTICAL ACTIVITY (keep as final mini-section if relevant):\n${ch.practical_activity}\n` : ""}
Write the condensed rewrite now.`,
            },
          ],
        }),
      },
    );
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`AI gateway ${resp.status}: ${txt.slice(0, 400)}`);
    }
    const json = await resp.json();
    const body = json?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!body) throw new Error("AI returned empty body");

    const updated = { ...cache, [personaCode]: body };
    await supabase
      .from("catalog_chapters")
      .update({ condensed_by_persona: updated })
      .eq("id", ch.id);

    return new Response(JSON.stringify({ body, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("condense-chapter error", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
