import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, contentCatalog } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a content discovery assistant for a learning & development platform. The user is building a Skill Target (a learning path) and searching for relevant content.

You have access to a content catalog provided below. When the user describes what they need, you must:
1. Analyze their request to understand the skills/topics they want to develop
2. Search through the catalog and find the most relevant modules, assessments, and role plays
3. Return your response using the search_content tool with the IDs of matching items
4. Include a brief explanation of why you selected these items and how they form a learning progression

CONTENT CATALOG:
${contentCatalog}

Always try to find relevant content. Consider partial keyword matches, related topics, and skill adjacencies. If someone asks for "customer support basics", match modules about communication, CRM, phone support, etc. Prioritize items that form a logical learning sequence (beginner → intermediate → advanced).`;

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
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_content",
              description: "Return matching content items from the catalog based on the user's query. Include a brief explanation of the selection.",
              parameters: {
                type: "object",
                properties: {
                  matchedIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of content IDs (e.g. m1, m20, a1, rp1) that match the user's query",
                  },
                  explanation: {
                    type: "string",
                    description: "Brief explanation of why these items were selected and how they help the user",
                  },
                },
                required: ["matchedIds", "explanation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "search_content" } },
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

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        matchedIds: args.matchedIds || [],
        explanation: args.explanation || "Here are the matching results.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({
      matchedIds: [],
      explanation: data.choices?.[0]?.message?.content || "I couldn't find matching content. Try different keywords.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
