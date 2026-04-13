import { cn } from "@/lib/utils";

export type PillResponseFormat = "text" | "inline_quiz" | "skill_gaps_chart" | "learning_path_visual";

export interface SuggestionPill {
  label: string;
  prompt: string;
  responseFormat?: PillResponseFormat;
}

interface SuggestionPillsProps {
  pills: SuggestionPill[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestionPillsRow({ pills, onSelect, disabled }: SuggestionPillsProps) {
  if (pills.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap px-1 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {pills.slice(0, 4).map((pill, i) => (
        <button
          key={i}
          onClick={() => onSelect(pill.prompt)}
          disabled={disabled}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            "bg-muted/50 hover:bg-accent/20 border border-border",
            "text-foreground/80 hover:text-foreground cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}

export interface PillContext {
  contentView: string;
  activeModuleId: string | null;
  learningMode: string;
  hasModules: boolean;
  allComplete: boolean;
  moduleSteps: { moduleId: string; status: string; skillTargetTitle: string }[];
  roleSkillGaps: { skillName: string; gap: string }[];
  projectNames: string[];
  // Dynamic context
  lastAssistantContent: string;
  usedPrompts: string[];
  activeModuleTitle: string | null;
  activeSkillTargetTitle: string | null;
  turnCount: number;
  nextModuleTitle: string | null;
}

function detectLastResponseType(content: string): "quiz" | "chart" | "path" | "text" {
  if (content.includes('"type":"inline_quiz"') || content.includes('RICH_BLOCK{"type":"inline_quiz"')) return "quiz";
  if (content.includes('"type":"skill_gaps_chart"') || content.includes('RICH_BLOCK{"type":"skill_gaps_chart"')) return "chart";
  if (content.includes('"type":"learning_path_visual"') || content.includes('RICH_BLOCK{"type":"learning_path_visual"')) return "path";
  return "text";
}

function filterUsed(pills: SuggestionPill[], usedPrompts: string[]): SuggestionPill[] {
  if (usedPrompts.length === 0) return pills;
  return pills.filter(p => !usedPrompts.some(used => used === p.prompt));
}

function rotatePool(pills: SuggestionPill[], turnCount: number, max: number): SuggestionPill[] {
  if (pills.length <= max) return pills;
  const offset = turnCount % pills.length;
  const rotated = [...pills.slice(offset), ...pills.slice(0, offset)];
  return rotated.slice(0, max);
}

export function computeSuggestionPills(ctx: PillContext): SuggestionPill[] {
  const responseType = detectLastResponseType(ctx.lastAssistantContent);
  let pool: SuggestionPill[] = [];

  // Reactive pills based on last AI response type
  const reactivePills: SuggestionPill[] = [];
  if (responseType === "quiz") {
    reactivePills.push(
      { label: "Explain what I got wrong", prompt: "Explain the answers I got wrong and why the correct answers are right", responseFormat: "text" },
      { label: "Try harder questions", prompt: "[FORMAT:inline_quiz] Give me harder questions on this same topic", responseFormat: "inline_quiz" },
      { label: "Summarize the key concepts", prompt: "Summarize the key concepts that this quiz tested", responseFormat: "text" },
    );
  } else if (responseType === "chart") {
    reactivePills.push(
      { label: "Deep dive on weakest skill", prompt: "Which of my skill gaps is the most critical and what should I do to close it?", responseFormat: "text" },
      { label: "Create a plan for my gaps", prompt: "Create a learning plan to address my biggest skill gaps", responseFormat: "text" },
      { label: "Show my learning path", prompt: "[FORMAT:learning_path_visual] Show my assigned learning path visually", responseFormat: "learning_path_visual" },
    );
  } else if (responseType === "path") {
    reactivePills.push(
      { label: "What should I start with?", prompt: "Based on my learning path, which module should I tackle first and why?", responseFormat: "text" },
      { label: "Show my skill gaps", prompt: "[FORMAT:skill_gaps_chart] Show my current skill gaps as a visual chart", responseFormat: "skill_gaps_chart" },
    );
  }

  // State-specific pills
  if (ctx.contentView === "assessment") {
    pool.push(
      { label: "What does this assess?", prompt: "What does this assessment cover and how should I prepare?", responseFormat: "text" },
      { label: "Tips for this assessment", prompt: "Give me tips to do well on this assessment", responseFormat: "text" },
      { label: "What if I don't pass?", prompt: "What happens if I don't pass this assessment? Can I retake it?", responseFormat: "text" },
      { label: "How long will it take?", prompt: "How long should this assessment take and what format is it?", responseFormat: "text" },
    );
  } else if (!ctx.hasModules) {
    pool.push(
      { label: "How do I get started?", prompt: "How do I get started with learning on this platform?", responseFormat: "text" },
      { label: "What skills should I build?", prompt: "[FORMAT:skill_gaps_chart] Based on my role, what skills should I focus on building? Show my current vs required skills visually.", responseFormat: "skill_gaps_chart" },
      { label: "Explore popular targets", prompt: "What are the most popular skill targets that people in similar roles are working on?", responseFormat: "text" },
      { label: "How does learning work here?", prompt: "Walk me through how the learning experience works on this platform", responseFormat: "text" },
    );
  } else if (ctx.allComplete) {
    pool.push(
      { label: "What skills have I improved?", prompt: "[FORMAT:skill_gaps_chart] Which skills have I improved through my completed modules? Show a visual of my progress.", responseFormat: "skill_gaps_chart" },
      { label: "What gaps remain?", prompt: "[FORMAT:skill_gaps_chart] What skill gaps do I still have based on my role requirements? Show them visually.", responseFormat: "skill_gaps_chart" },
      { label: "Recommend next steps", prompt: "What should I focus on next in my learning journey?", responseFormat: "text" },
      { label: "Summarize my journey", prompt: "Give me a summary of everything I've learned across all my completed modules", responseFormat: "text" },
      { label: "Test my knowledge", prompt: "[FORMAT:inline_quiz] Quiz me across all the topics I've completed", responseFormat: "inline_quiz" },
    );
  } else if (ctx.activeModuleId) {
    const modTitle = ctx.activeModuleTitle || "this module";
    const stTitle = ctx.activeSkillTargetTitle || "";

    pool.push(
      { label: `Summarize ${truncate(modTitle, 18)}`, prompt: `Give me a concise summary of what "${modTitle}" covers`, responseFormat: "text" },
      { label: "Quiz me on this", prompt: "[FORMAT:inline_quiz] Quiz me on the key concepts from this chapter with a short multiple choice quiz.", responseFormat: "inline_quiz" },
      { label: "How does this help my role?", prompt: `How does "${modTitle}" relate to my current role and skill gaps?`, responseFormat: "text" },
      { label: "Key takeaways", prompt: `What are the most important takeaways from "${modTitle}" that I should remember?`, responseFormat: "text" },
      { label: "Real-world examples", prompt: `Give me real-world examples of how I'd apply what I'm learning in "${modTitle}"`, responseFormat: "text" },
      { label: "Explain it simply", prompt: `Explain the main concepts from "${modTitle}" as if I'm completely new to this topic`, responseFormat: "text" },
    );

    if (ctx.learningMode !== "visual") {
      pool.push({ label: "Switch to visual mode", prompt: "Switch to visual mode for this content", responseFormat: "text" });
    }
    if (ctx.learningMode !== "reading") {
      pool.push({ label: "Switch to reading mode", prompt: "Switch to reading mode for this content", responseFormat: "text" });
    }

    if (ctx.nextModuleTitle) {
      pool.push({ label: `Preview: ${truncate(ctx.nextModuleTitle, 16)}`, prompt: `What will I learn in "${ctx.nextModuleTitle}" and how does it build on what I'm studying now?`, responseFormat: "text" });
    }

    if (stTitle) {
      pool.push({ label: `About ${truncate(stTitle, 16)}`, prompt: `Tell me more about the "${stTitle}" skill target and how this module fits into it`, responseFormat: "text" });
    }
  } else {
    pool.push(
      { label: "What should I learn first?", prompt: "Based on my skill gaps and role, what should I learn first?", responseFormat: "text" },
      { label: "Show my skill gaps", prompt: "[FORMAT:skill_gaps_chart] What are my current skill gaps compared to my role requirements? Show them as a visual chart.", responseFormat: "skill_gaps_chart" },
      { label: "Show my learning path", prompt: "[FORMAT:learning_path_visual] Walk me through my assigned learning path visually showing each module and its status.", responseFormat: "learning_path_visual" },
      { label: "How much is left?", prompt: "How many modules do I have left to complete and how long will they take?", responseFormat: "text" },
      { label: "What's most urgent?", prompt: "Which of my assigned modules is the most urgent or important to complete first?", responseFormat: "text" },
    );
  }

  // Add role skill gap pills if room
  const highGaps = ctx.roleSkillGaps.filter(g => g.gap === "High gap");
  if (highGaps.length > 0) {
    pool.push({
      label: "My biggest skill gaps",
      prompt: "[FORMAT:skill_gaps_chart] Which of my skills need the most work? Show a visual chart of my gaps.",
      responseFormat: "skill_gaps_chart",
    });
  }

  // Add project pills
  if (ctx.projectNames.length > 0) {
    const project = ctx.projectNames[0];
    pool.push({
      label: `Help with ${truncate(project, 18)}`,
      prompt: `How does my current learning help with the "${project}" project?`,
      responseFormat: "text",
    });
  }

  // Combine: reactive pills first (they're most relevant), then state pool
  const combined = [...reactivePills, ...pool];

  // Filter out already-used prompts
  const filtered = filterUsed(combined, ctx.usedPrompts);

  // Rotate based on turn count to show variety
  return rotatePool(filtered, ctx.turnCount, 4);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
