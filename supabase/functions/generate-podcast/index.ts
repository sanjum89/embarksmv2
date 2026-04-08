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

const DEFAULT_VOICES: Record<string, string> = {
  "Sarah Chen": "EXAVITQu4vr4xnSDxMaL",
  "James Morton": "JBFqnCBsd6RMkjVDRZzb",
  "Eleanor Webb": "FGY2WhTYpPnrIDTdsKH5",
};
const FALLBACK_VOICE = "JBFqnCBsd6RMkjVDRZzb";

/**
 * Request PCM (raw 16-bit signed LE, mono, 44100 Hz) from ElevenLabs.
 * PCM segments can be trivially concatenated and wrapped in a WAV header
 * to produce a perfectly seekable file.
 */
async function generateTurnPCM(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<Uint8Array> {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_44100`,
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

/** Build a valid WAV header for raw PCM data (16-bit mono 44100 Hz). */
function buildWavHeader(pcmLength: number): Uint8Array {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataChunkSize = pcmLength;
  const fileSize = 36 + dataChunkSize; // 44 - 8 (RIFF header) + data

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk
  writeString(view, 0, "RIFF");
  view.setUint32(4, fileSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataChunkSize, true);

  return new Uint8Array(header);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
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

    const voices = { ...DEFAULT_VOICES, ...(voiceMap || {}) };

    // Generate PCM for each turn sequentially
    const segments: Uint8Array[] = [];
    for (let i = 0; i < script.length; i++) {
      const line = script[i];
      const voice = line.voiceId || voices[line.speaker] || FALLBACK_VOICE;
      console.log(`Generating turn ${i + 1}/${script.length}: ${line.speaker} (voice ${voice})`);
      const pcm = await generateTurnPCM(line.text, voice, ELEVENLABS_API_KEY);
      segments.push(pcm);
    }

    // Concatenate all PCM segments
    const totalPCMLength = segments.reduce((sum, s) => sum + s.length, 0);
    const pcmData = new Uint8Array(totalPCMLength);
    let offset = 0;
    for (const seg of segments) {
      pcmData.set(seg, offset);
      offset += seg.length;
    }

    // Build WAV = header + PCM data
    const wavHeader = buildWavHeader(totalPCMLength);
    const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
    wavFile.set(wavHeader, 0);
    wavFile.set(pcmData, wavHeader.length);

    // Upload to storage as .wav
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const filePath = `${moduleId}.wav`;
    const { error: uploadError } = await supabase.storage
      .from("podcast-audio")
      .upload(filePath, wavFile, { contentType: "audio/wav", upsert: true });

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
        sizeBytes: wavFile.length,
        format: "wav",
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
