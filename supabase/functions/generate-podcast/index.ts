import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScriptLine {
  speaker: string;
  text: string;
  voiceId?: string;
}

/**
 * Default voice map — used when no per-line voiceId is provided.
 * Maps speaker names to ElevenLabs voice IDs.
 */
const DEFAULT_VOICES: Record<string, string> = {
  "Sarah Chen": "EXAVITQu4vr4xnSDxMaL",   // Sarah
  "James Morton": "JBFqnCBsd6RMkjVDRZzb",  // George
  "Eleanor Webb": "FGY2WhTYpPnrIDTdsKH5",  // Laura
};
const FALLBACK_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George

async function generateTurnAudio(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<Uint8Array> {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
      }),
    },
  );
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`ElevenLabs error ${resp.status}: ${errText}`);
  }
  return new Uint8Array(await resp.arrayBuffer());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { moduleId, script, voiceMap } = body as {
      moduleId: string;
      script: ScriptLine[];
      voiceMap?: Record<string, string>;
    };

    if (!moduleId || !script || !Array.isArray(script) || script.length === 0) {
      return new Response(
        JSON.stringify({ error: "moduleId and script[] required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Merge provided voiceMap with defaults
    const voices = { ...DEFAULT_VOICES, ...(voiceMap || {}) };

    // Generate audio for each turn sequentially
    const segments: Uint8Array[] = [];
    for (let i = 0; i < script.length; i++) {
      const line = script[i];
      const voice = line.voiceId || voices[line.speaker] || FALLBACK_VOICE;
      console.log(`Generating turn ${i + 1}/${script.length}: ${line.speaker} (voice ${voice})`);
      const audio = await generateTurnAudio(line.text, voice, ELEVENLABS_API_KEY);
      segments.push(audio);
    }

    // Concatenate MP3 segments (MP3 frames are self-describing so simple concat works)
    const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const seg of segments) {
      combined.set(seg, offset);
      offset += seg.length;
    }

    // Upload to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const filePath = `${moduleId}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("podcast-audio")
      .upload(filePath, combined, { contentType: "audio/mpeg", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Upload failed", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: urlData } = supabase.storage
      .from("podcast-audio")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl: urlData.publicUrl,
        moduleId,
        turns: script.length,
        sizeBytes: combined.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-podcast error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
