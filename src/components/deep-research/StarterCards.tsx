import {
  Activity,
  Users,
  ShieldAlert,
  ListChecks,
  ClipboardList,
  Wrench,
  Target,
  FileBarChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarterCard {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  output: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

export const STARTERS: StarterCard[] = [
  {
    id: "cohort-health",
    category: "Cohort health",
    title: "Cohort readiness picture",
    description: "Who is on track, who is at risk, and why.",
    prompt: "Show me the Associate IM cohort readiness picture.",
    output: "Readiness funnel · competency heatmap · top blockers",
    icon: Activity,
  },
  {
    id: "compare-learners",
    category: "Compare learners",
    title: "Why are journeys different?",
    description: "Side-by-side learner profiles and how Embark adapted their paths.",
    prompt: "Why are Clara and Theo seeing different module formats?",
    output: "Side-by-side radar · adaptation breakdown · plain-English reason",
    icon: Users,
  },
  {
    id: "risk-critical",
    category: "Risk-critical",
    title: "Are they safe to progress?",
    description: "Suitability, Consumer Duty, AML, judgement and risk gates.",
    prompt: "Are Clara and Theo safe to progress?",
    output: "Risk matrix · evidence checklist · do-not-progress cards",
    icon: ShieldAlert,
  },
  {
    id: "manager-actions",
    category: "Manager actions",
    title: "What should I do this week?",
    description: "Prioritised actions to move the cohort forward.",
    prompt: "What should I do this week to help this cohort progress?",
    output: "Prioritised action board · execute chips · impact",
    icon: ListChecks,
  },
  {
    id: "readiness-summary",
    category: "Readiness summary",
    title: "Build a readiness summary",
    description: "One-page evidence pack with recommendation.",
    prompt: "Create a readiness-board summary for Clara.",
    output: "Evidence pack · radar · recommendation",
    icon: ClipboardList,
  },
  {
    id: "module-audit",
    category: "Module adaptation audit",
    title: "Which modules are full vs condensed?",
    description: "Audit how Embark is shaping each learner's content.",
    prompt: "Which modules are full, condensed, diagnostic, or evidence-only for Clara and Theo?",
    output: "Adaptation table · stacked bar · journey timeline",
    icon: Wrench,
    comingSoon: true,
  },
  {
    id: "competency-gaps",
    category: "Competency gaps",
    title: "Biggest gaps in the pathway",
    description: "Role requirement vs current level across the cohort.",
    prompt: "Where are the biggest competency gaps in the Associate IM pathway?",
    output: "Heatmap · top-gap ranking · linked modules",
    icon: Target,
    comingSoon: true,
  },
  {
    id: "evidence-gap",
    category: "Evidence gaps",
    title: "Knowledge OK, evidence missing",
    description: "Find learners who know it but lack validation.",
    prompt: "Where do learners know the content but still need evidence?",
    output: "Evidence cards · evidence timeline · knowledge-vs-evidence matrix",
    icon: FileBarChart,
    comingSoon: true,
  },
  {
    id: "stretch-readiness",
    category: "Stretch readiness",
    title: "Who is ready for stretch?",
    description: "Safe stretch areas and unlock recommendations.",
    prompt: "Who might be ready for stretch content?",
    output: "Stretch ladder · unlock cards · safe/caution/blocked",
    icon: Sparkles,
    comingSoon: true,
  },
  {
    id: "journey-effectiveness",
    category: "Effectiveness",
    title: "What's actually moving readiness?",
    description: "Which modules create the most readiness lift.",
    prompt: "Which modules are creating the most readiness movement?",
    output: "Impact scatter · ranking · low-impact alerts",
    icon: TrendingUp,
    comingSoon: true,
  },
];

interface Props {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}

export function StarterCards({ onPick, disabled }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Suggested research
        </div>
        <div className="grid gap-2">
          {STARTERS.filter((s) => !s.comingSoon).map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s.prompt)}
              disabled={disabled}
              className={cn(
                "text-left rounded-xl border border-border/60 bg-card p-3 group transition-all duration-200",
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-muted/40 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary shrink-0 transition-transform group-hover:scale-110">
                  <s.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {s.category}
                  </div>
                  <div className="text-xs font-medium leading-tight">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.output}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Coming soon
        </div>
        <div className="grid gap-1.5">
          {STARTERS.filter((s) => s.comingSoon).map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-dashed border-border/50 p-2 flex items-center gap-2 opacity-60"
              title={s.prompt}
            >
              <s.icon className="h-3.5 w-3.5 shrink-0" />
              <div className="text-[11px] font-medium truncate">{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
