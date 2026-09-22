// Mirrors all account-scoped learning content from one account into another.
// Used to keep the Pinnacle Capital white-label an exact copy of Rathbones.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RATHBONES_ID = "6c49ca7c-fecb-4b34-a690-7e4e28bb2194";
const PINNACLE_ID = "08b9c4d5-f4ec-44bb-8bc2-099d9848f465";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const source = String(body.source_account_id ?? RATHBONES_ID);
    const target = String(body.target_account_id ?? PINNACLE_ID);

    if (!UUID_RE.test(source) || !UUID_RE.test(target) || source === target) {
      return new Response(
        JSON.stringify({ error: "source_account_id and target_account_id must be distinct uuids" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: 'embarksmv2' } }
    );

    const { data, error } = await supabase.rpc("mirror_account_content", {
      p_source: source,
      p_target: target,
    });
    if (error) {
      console.error("mirror_account_content failed:", error);
      return new Response(JSON.stringify({ error: "Mirror failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Keep the feature flag in step with the source account.
    const { data: src } = await supabase
      .from("accounts")
      .select("workforce_groups_enabled")
      .eq("id", source)
      .maybeSingle();
    if (src) {
      await supabase
        .from("accounts")
        .update({ workforce_groups_enabled: src.workforce_groups_enabled })
        .eq("id", target);
    }

    return new Response(JSON.stringify({ ok: true, source, target, counts: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mirror-account-content error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
