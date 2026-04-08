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
 * Strip ID3v2 tags from the start of an MP3 buffer.
 * ID3v2 headers start with "ID3" and contain a syncsafe size.
 * Removing them from all-but-the-first segment prevents the browser
 * from misreading duration when concatenated MP3 segments each have headers.
 */
function stripID3v2(data: Uint8Array): Uint8Array {
  // Check for ID3v2 header: starts with "ID3"
  if (data.length < 10) return data;
  if (data[0] !== 0x49 || data[1] !== 0x44 || data[2] !== 0x33) return data;

  // Syncsafe integer at bytes 6-9
  const size =
    ((data[6] & 0x7f) << 21) |
    ((data[7] & 0x7f) << 14) |
    ((data[8] & 0x7f) << 7) |
    (data[9] & 0x7f);
  const headerSize = 10 + size;

  if (headerSize >= data.length) return data;
  return data.slice(headerSize);
}

/**
 * Find and remove any Xing/Info VBR header frame from MP3 data.
 * These frames are placed by encoders and can confuse duration calculation
 * when multiple files are concatenated.
 */
function stripXingFrame(data: Uint8Array): Uint8Array {
  // Look for "Xing" or "Info" marker in the first 512 bytes
  for (let i = 0; i < Math.min(data.length - 4, 512); i++) {
    if (
      (data[i] === 0x58 && data[i+1] === 0x69 && data[i+2] === 0x6E && data[i+3] === 0x67) || // "Xing"
      (data[i] === 0x49 && data[i+1] === 0x6E && data[i+2] === 0x66 && data[i+3] === 0x6F)    // "Info"
    ) {
      // Found Xing/Info — we need to find the MPEG frame that contains it
      // Walk backwards to find the frame sync (0xFF 0xE? or 0xFF 0xF?)
      let frameStart = i;
      while (frameStart > 0) {
        if (data[frameStart] === 0xFF && (data[frameStart + 1] & 0xE0) === 0xE0) {
          break;
        }
        frameStart--;
      }
      // Skip this entire frame (typically 417 or 418 bytes for 128kbps 44100Hz)
      // Calculate frame length from header
      const frameLen = getMpegFrameLength(data, frameStart);
      if (frameLen > 0 && frameStart + frameLen <= data.length) {
        const before = data.slice(0, frameStart);
        const after = data.slice(frameStart + frameLen);
        const result = new Uint8Array(before.length + after.length);
        result.set(before, 0);
        result.set(after, before.length);
        return result;
      }
      break;
    }
  }
  return data;
}

function getMpegFrameLength(data: Uint8Array, offset: number): number {
  if (offset + 4 > data.length) return 0;
  const h = (data[offset] << 24) | (data[offset+1] << 16) | (data[offset+2] << 8) | data[offset+3];
  
  const bitrateIdx = (h >> 12) & 0x0F;
  const sampleRateIdx = (h >> 10) & 0x03;
  const padding = (h >> 9) & 0x01;
  
  const bitrates = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];
  const sampleRates = [44100, 48000, 32000, 0];
  
  const bitrate = bitrates[bitrateIdx];
  const sampleRate = sampleRates[sampleRateIdx];
  
  if (!bitrate || !sampleRate) return 0;
  return Math.floor(144000 * bitrate / sampleRate) + padding;
}

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

    const voices = { ...DEFAULT_VOICES, ...(voiceMap || {}) };

    // Generate audio for each turn sequentially
    const segments: Uint8Array[] = [];
    for (let i = 0; i < script.length; i++) {
      const line = script[i];
      const voice = line.voiceId || voices[line.speaker] || FALLBACK_VOICE;
      console.log(`Generating turn ${i + 1}/${script.length}: ${line.speaker} (voice ${voice})`);
      let audio = await generateTurnAudio(line.text, voice, ELEVENLABS_API_KEY);
      
      // Strip ID3v2 tags and Xing/Info VBR headers from every segment
      // so the concatenated result has clean MPEG frames only
      audio = stripID3v2(audio);
      audio = stripXingFrame(audio);
      
      segments.push(audio);
    }

    // Concatenate clean MP3 frames
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
