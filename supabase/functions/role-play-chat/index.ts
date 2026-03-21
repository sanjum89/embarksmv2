import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, rolePlayContext, summarize } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = summarize
      ? `You are now a supportive learning coach providing feedback on a role play session that just ended.

SCENARIO WAS: ${rolePlayContext?.scenario || "A general conversation"}
PERSONA WAS: ${rolePlayContext?.persona || "A character"}

INSTRUCTIONS:
- Break character completely. You are now a coach, not the persona.
- Respond with ONLY a valid JSON object (no markdown, no code fences, no extra text).
- The JSON must have this exact structure:
{
  "overallScore": <number 1-10>,
  "customerSentiment": "<positive|neutral|frustrated>",
  "learnerSentiment": "<confident|developing|needs-work>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>"],
  "summary": "<2-3 sentence encouraging narrative>"
}
- overallScore: Rate the learner's performance from 1 (poor) to 10 (excellent).
- customerSentiment: How the customer/persona would feel after this interaction.
- learnerSentiment: Your assessment of the learner's confidence and skill level shown.
- strengths: 2-3 specific things the learner did well with brief examples.
- improvements: 1-2 constructive suggestions for next time.
- summary: A warm, encouraging 2-3 sentence overall narrative.
- Output ONLY the JSON object. No other text before or after.`
      : `You are playing the role of a character in a training role play simulation. Stay in character at all times.

CHARACTER: ${rolePlayContext?.persona || "A customer"}
SCENARIO: ${rolePlayContext?.scenario || "A general conversation"}
CONTEXT: ${rolePlayContext?.context || "No additional context"}

INSTRUCTIONS:
- Stay fully in character as the persona described above.
- Respond naturally as this character would in the given scenario.
- Be realistic — push back, ask questions, show emotions appropriate to the character.
- Keep responses conversational and concise (2-4 sentences typically).
- Do NOT break character or acknowledge that this is a simulation.
- Do NOT provide coaching or feedback — just be the character.
- React to what the user says as the character would.`;

    // For summarize calls, don't stream — return complete JSON
    if (summarize) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: response.status === 429 ? 429 : response.status === 402 ? 402 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ summary: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming for regular chat
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("role-play-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
