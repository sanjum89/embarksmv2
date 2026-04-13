import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLearnPath } from "@/contexts/LearnPathContext";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";

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

interface PillContext {
  contentView: string;
  activeModuleId: string | null;
  learningMode: string;
  hasModules: boolean;
  allComplete: boolean;
  moduleSteps: { moduleId: string; status: string; skillTargetTitle: string }[];
  roleSkillGaps: { skillName: string; gap: string }[];
  projectNames: string[];
}

export function computeSuggestionPills(ctx: PillContext): SuggestionPill[] {
  const pills: SuggestionPill[] = [];

  if (ctx.contentView === "assessment") {
    pills.push(
      { label: "What does this assess?", prompt: "What does this assessment cover and how should I prepare?", responseFormat: "text" },
      { label: "Tips for this assessment", prompt: "Give me tips to do well on this assessment", responseFormat: "text" }
    );
    return pills;
  }

  if (!ctx.hasModules) {
    pills.push(
      { label: "How do I get started?", prompt: "How do I get started with learning on this platform?", responseFormat: "text" },
      { label: "What skills should I build?", prompt: "[FORMAT:skill_gaps_chart] Based on my role, what skills should I focus on building? Show my current vs required skills visually.", responseFormat: "skill_gaps_chart" }
    );
    return pills;
  }

  if (ctx.allComplete) {
    pills.push(
      { label: "What skills have I improved?", prompt: "[FORMAT:skill_gaps_chart] Which skills have I improved through my completed modules? Show a visual of my progress.", responseFormat: "skill_gaps_chart" },
      { label: "What gaps remain?", prompt: "[FORMAT:skill_gaps_chart] What skill gaps do I still have based on my role requirements? Show them visually.", responseFormat: "skill_gaps_chart" },
      { label: "Recommend next steps", prompt: "What should I focus on next in my learning journey?", responseFormat: "text" }
    );
    return pills;
  }

  if (ctx.activeModuleId) {
    pills.push(
      { label: "Summarize this chapter", prompt: "Give me a concise summary of what this chapter covers", responseFormat: "text" },
      { label: "Quiz me on this", prompt: "[FORMAT:inline_quiz] Quiz me on the key concepts from this chapter with a short multiple choice quiz.", responseFormat: "inline_quiz" }
    );

    if (ctx.learningMode !== "visual") {
      pills.push({ label: "Switch to visual mode", prompt: "Switch to visual mode for this content", responseFormat: "text" });
    }
    if (ctx.learningMode !== "reading") {
      pills.push({ label: "Switch to reading mode", prompt: "Switch to reading mode for this content", responseFormat: "text" });
    }

    pills.push({ label: "How does this relate to my role?", prompt: "How does this module relate to my current role and skill gaps?", responseFormat: "text" });
  } else {
    pills.push(
      { label: "What should I learn first?", prompt: "Based on my skill gaps and role, what should I learn first?", responseFormat: "text" },
      { label: "Show my skill gaps", prompt: "[FORMAT:skill_gaps_chart] What are my current skill gaps compared to my role requirements? Show them as a visual chart.", responseFormat: "skill_gaps_chart" },
      { label: "What's my learning path?", prompt: "[FORMAT:learning_path_visual] Walk me through my assigned learning path visually showing each module and its status.", responseFormat: "learning_path_visual" }
    );
  }

  const highGaps = ctx.roleSkillGaps.filter(g => g.gap === "High gap");
  if (highGaps.length > 0 && pills.length < 4) {
    pills.push({
      label: "My biggest skill gaps",
      prompt: `[FORMAT:skill_gaps_chart] Which of my skills need the most work? Show a visual chart of my gaps.`,
      responseFormat: "skill_gaps_chart",
    });
  }

  if (ctx.projectNames.length > 0 && pills.length < 4) {
    const project = ctx.projectNames[0];
    pills.push({
      label: `Help with ${project.length > 20 ? project.slice(0, 18) + "…" : project}`,
      prompt: `How does my current learning help with the "${project}" project?`,
      responseFormat: "text",
    });
  }

  return pills.slice(0, 4);
}
