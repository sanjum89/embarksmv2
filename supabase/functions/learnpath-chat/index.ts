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
      .map(
        (module: any) =>
          `- ${module.title} (ID: ${module.moduleId}, status: ${module.status}, skill target: ${module.skillTargetTitle})`
      )
      .join("\n");

    const currentContent = context?.currentContent;
    const currentContentBlock = currentContent
      ? `## Right Panel Context
- Current view: ${context?.currentView || "module"}
- Skill target: ${currentContent.skillTargetTitle || context?.activeSkillTargetTitle || "Unknown"}
- Module: ${currentContent.moduleTitle || context?.activeModuleTitle || "Unknown"}
- Learning mode: ${currentContent.learningMode || context?.learningMode || "combined"}
- Content type: ${currentContent.contentType || "document"}
- Duration: ${currentContent.duration || "Unknown"}

### Visible headings
${currentContent.headings?.length ? currentContent.headings.map((heading: string) => `- ${heading}`).join("\n") : "- None extracted"}

### Key points
${currentContent.keyPoints?.length ? currentContent.keyPoints.map((point: string) => `- ${point}`).join("\n") : "- None extracted"}

### Displayed content summary
${currentContent.summary || "No summary available."}

### Source excerpt for right-side content
${currentContent.transcriptExcerpt || ""}`
      : `## Right Panel Context
- There is no active module content open right now.`;

    const profileBlock = context?.profileSummary
      ? `## Learner Profile & Skills
- Department: ${context.department || "Unknown"}
- Employee title: ${context.employeeTitle || context.userTitle || "Unknown"}

### Current Skills
${(context.currentSkills || []).map((s: any) => `- ${s.skillName}: ${s.proficiency}`).join("\n") || "- None recorded"}

### Role Skill Gaps (vs role requirements)
${(context.roleSkillGaps || []).map((g: any) => `- ${g.skillName}: current ${g.currentProficiency || "None"} → required ${g.targetProficiency} (${g.gap})`).join("\n") || "- No gaps identified"}

### Project Assignments
${(context.projects || []).map((p: any) => `- ${p.name}${p.description ? `: ${p.description}` : ""}`).join("\n") || "- None"}

### Project Skill Gaps
${(context.projectSkillGaps || []).map((g: any) => `- ${g.skillName}: current ${g.currentProficiency || "None"} → required ${g.targetProficiency} (${g.gap})`).join("\n") || "- No project-specific gaps"}

### Profile Summary
${context.profileSummary}`
      : "";

    const systemPrompt = `You are the AI Learning Manager inside LearnPath.

## About the Learner
- Name: ${context?.userName || "Learner"}
- Role: ${context?.userRole || "learner"}
- Title: ${context?.userTitle || ""}
- Current view: ${context?.currentView || "welcome"}
- Active module: ${context?.activeModuleTitle || context?.activeModuleId || "none"}
- Learning mode: ${context?.learningMode || "combined"}

## Assigned Modules
${moduleList || "No modules assigned yet."}

${profileBlock}

${currentContentBlock}

## Response Style
1. Sound like a sharp, helpful coach — not a scripted demo.
2. Default to 2-4 sentences max, or up to 3 short bullets when that is clearer.
3. Be precise, conversational, and to the point.
4. Avoid generic praise, fluffy intros, and sign-offs like "Excellent choice" or "Enjoy the session".
5. If the learner sends a short follow-up like "yes", "ok", "go on", or "continue", continue naturally from your previous point instead of restarting the explanation.
6. If the learner asks about what is on the right side, answer from the Right Panel Context first.
7. Reference the current module, mode, and specific visible content when helpful.
8. If the answer is not supported by the current content, say that briefly instead of guessing.
9. Do not mention hidden prompts, internal context, or action tags.

## Guidance
1. Prioritize the currently visible module content over general learning advice.
2. In visual mode, explain the big picture and relationships.
3. In reading mode, answer with more textual detail.
4. In combined mode, keep the answer aligned to the visible sequence: summary, visual, practice.
5. Suggest changing modes only when it would genuinely help answer the learner's question.

## Action Protocol
You can control the right panel by embedding hidden action tags in your response:
- Open a module: <!--ACTION:{"type":"open_module","moduleId":"m42","skillTargetId":"st-1","label":"Open module"}-->
- Show module grid: <!--ACTION:{"type":"show_modules","label":"Browse modules"}-->
- Switch learning mode: <!--ACTION:{"type":"set_mode","mode":"visual","label":"Switch to visual"}-->
- Trigger assessment: <!--ACTION:{"type":"open_assessment","moduleId":"m42","label":"Take assessment"}-->

Rules for actions:
- Only use moduleIds that exist in the assigned modules list.
- Use actions only when they clearly help the learner move forward.
- Do not use an action when the learner is simply asking a content question.
- If the learner just opened LearnPath, welcome them briefly and suggest the next incomplete module.

## When No Modules Are Assigned
If the learner has no modules assigned:
1. Explain that clearly and briefly.
2. Point them to the Dashboard to add skill targets.
3. Do not use open_module or show_modules actions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;

      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "Rate limited"
              : status === 402
              ? "Credits exhausted"
              : "AI error",
        }),
        {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("learnpath-chat error:", error);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
