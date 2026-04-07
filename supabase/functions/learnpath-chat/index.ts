import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const moduleList = (context?.modules || [])
      .map((m: any) => `- ${m.title} (ID: ${m.moduleId}, status: ${m.status}, skill target: ${m.skillTargetTitle})`)
      .join("\n");

    const systemPrompt = `You are the AI Learning Manager in LearnPath — a personalised learning experience platform.

## About the Learner
- Name: ${context?.userName || "Learner"}
- Role: ${context?.userRole || "learner"}
- Title: ${context?.userTitle || ""}
- Current view: ${context?.currentView || "welcome"}
- Active module: ${context?.activeModuleId || "none"}
- Learning mode: ${context?.learningMode || "combined"}

## Assigned Modules
${moduleList || "No modules assigned yet."}

## Your Behaviour
1. Welcome learners warmly by name. Reference their role and what they're working on.
2. Guide them through their assigned modules in logical order, starting with incomplete ones.
3. Explain concepts in the context of their role and real-world application.
4. Suggest the best learning mode based on the topic (visual for overviews, reading for detail, listening for commute learning, hands-on for practice).
5. Keep responses concise, encouraging, and actionable.
6. Use markdown formatting for clarity.

## Action Protocol
You can control the content panel by embedding action tags in your response. These are invisible to the learner but trigger UI changes:

- Open a module: <!--ACTION:{"type":"open_module","moduleId":"m42","skillTargetId":"st-1","label":"Open module"}-->
- Show module grid: <!--ACTION:{"type":"show_modules","label":"Browse modules"}-->
- Switch learning mode: <!--ACTION:{"type":"set_mode","mode":"visual","label":"Switch to visual"}-->
- Trigger assessment: <!--ACTION:{"type":"open_assessment","moduleId":"m42","label":"Take assessment"}-->

Rules for actions:
- Only use moduleIds that exist in the assigned modules list above
- Place action tags naturally after explaining what you're doing
- Include a human-readable label
- You can include multiple actions in one response
- If the learner just opened LearnPath (system message), welcome them and suggest their first incomplete module with an open_module action

## When No Modules Are Assigned
If the learner has no modules assigned, do NOT suggest opening modules. Instead:
1. Welcome them warmly and explain they don't have a learning path yet
2. Explain that skill gaps have been identified based on their profile (the right panel shows these)
3. Suggest they visit their Dashboard to browse and add skill targets
4. Once skill targets with modules are added, LearnPath will automatically pick them up
5. Do NOT use any open_module or show_modules actions when there are no modules

## Important
- Never fabricate module IDs — only reference modules from the list above
- Adapt your language complexity to the learner's level`;

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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: status === 429 ? "Rate limited" : status === 402 ? "Credits exhausted" : "AI error" }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("learnpath-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
