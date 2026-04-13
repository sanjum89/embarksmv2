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
      { label: "What does this assess?", prompt: "What does this assessment cover and how should I prepare?" },
      { label: "Tips for this assessment", prompt: "Give me tips to do well on this assessment" }
    );
    return pills;
  }

  if (!ctx.hasModules) {
    pills.push(
      { label: "How do I get started?", prompt: "How do I get started with learning on this platform?" },
      { label: "What skills should I build?", prompt: "Based on my role, what skills should I focus on building?" }
    );
    return pills;
  }

  if (ctx.allComplete) {
    pills.push(
      { label: "What skills have I improved?", prompt: "Which skills have I improved through my completed modules?" },
      { label: "What gaps remain?", prompt: "What skill gaps do I still have based on my role requirements?" },
      { label: "Recommend next steps", prompt: "What should I focus on next in my learning journey?" }
    );
    return pills;
  }

  if (ctx.activeModuleId) {
    // Module is open
    pills.push(
      { label: "Summarize this chapter", prompt: "Give me a concise summary of what this chapter covers" },
      { label: "Quiz me on this", prompt: "Quiz me on the key concepts from this chapter" }
    );

    if (ctx.learningMode !== "visual") {
      pills.push({ label: "Switch to visual mode", prompt: "Switch to visual mode for this content" });
    }
    if (ctx.learningMode !== "reading") {
      pills.push({ label: "Switch to reading mode", prompt: "Switch to reading mode for this content" });
    }

    pills.push({ label: "How does this relate to my role?", prompt: "How does this module relate to my current role and skill gaps?" });
  } else {
    // Welcome / module grid
    pills.push(
      { label: "What should I learn first?", prompt: "Based on my skill gaps and role, what should I learn first?" },
      { label: "Show my skill gaps", prompt: "What are my current skill gaps compared to my role requirements?" },
      { label: "What's my learning path?", prompt: "Walk me through my assigned learning path and what to expect" }
    );
  }

  // Add profile-aware pills
  const highGaps = ctx.roleSkillGaps.filter(g => g.gap === "High gap");
  if (highGaps.length > 0 && pills.length < 4) {
    pills.push({
      label: "My biggest skill gaps",
      prompt: `Which of my skills need the most work and how can I close those gaps?`,
    });
  }

  if (ctx.projectNames.length > 0 && pills.length < 4) {
    const project = ctx.projectNames[0];
    pills.push({
      label: `Help with ${project.length > 20 ? project.slice(0, 18) + "…" : project}`,
      prompt: `How does my current learning help with the "${project}" project?`,
    });
  }

  return pills.slice(0, 4);
}
