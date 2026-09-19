import { useNavigate } from "react-router-dom";
import { useEmbark } from "@/contexts/LearnPathContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Lock,
  Play,
  ClipboardCheck,
  MessageSquare,
  FileText,
  Clock,
  Eye,
  SkipForward,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import type { UnifiedStep } from "./LearnPathContent";

interface ChapterRowProps {
  step: UnifiedStep & { lensState?: string };
  index: number;
  isActive: boolean;
  isLast: boolean;
}

const lensPill: Record<string, { label: string; className: string }> = {
  skipped_by_diagnostic: {
    label: "SKIPPED",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  reopened_after_wrong: {
    label: "REOPENED",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  covered_by_evidence: {
    label: "COVERED BY EVIDENCE",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  trimmed_by_micro: {
    label: "CONDENSED",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  synthetic_diagnostic: {
    label: "QUICK DIAGNOSTIC",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  },
  synthetic_evidence: {
    label: "EVIDENCE TASK",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};

const typeLabel: Record<string, string> = {
  module: "Chapter",
  assessment: "Assessment",
  role_play: "Role Play",
};

const typeIcon = {
  module: FileText,
  assessment: ClipboardCheck,
  role_play: MessageSquare,
} as const;

export function EmbarkChapterRow({ step, index, isActive, isLast }: ChapterRowProps) {
  const { openModule, openAssessment, openModulePreview, openAssessmentPreview } = useEmbark();
  const { substitute } = useContentSubstitution();
  const navigate = useNavigate();

  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";
  const isSkipped = step.status === "skipped";
  const isPendingSkip = !!step.pendingSkip && !isSkipped && !isCompleted;
  const isInProgress = (step.status === "in_progress" || isActive) && !isPendingSkip;
  const lens = step.lensState;
  const isReadOnlySkipped =
    lens === "skipped_by_diagnostic" || lens === "covered_by_evidence" || lens === "trimmed_by_micro" || isPendingSkip;

  const handleOpen = () => {
    if (isLocked) return;
    // Skipped chapters open in preview mode (read-only) so progress isn't tracked
    if (isReadOnlySkipped) {
      if (step.type === "assessment") openAssessmentPreview(step.stepId);
      else if (step.type === "role_play") navigate(`/role-play/${step.referenceId ?? step.stepId}?preview=1`);
      else openModulePreview(step.moduleId, step.skillTargetId);
      return;
    }
    if (step.type === "assessment") openAssessment(step.stepId);
    else if (step.type === "role_play") navigate(`/role-play/${step.referenceId ?? step.stepId}`);
    else openModule(step.moduleId, step.skillTargetId);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (step.type === "assessment") openAssessmentPreview(step.stepId);
    else if (step.type === "role_play") navigate(`/role-play/${step.referenceId ?? step.stepId}?preview=1`);
    else openModulePreview(step.moduleId, step.skillTargetId);
  };

  const TypeIcon = typeIcon[step.type] ?? FileText;

  // Status icon node
  const statusNode = isCompleted ? (
    <div className="h-7 w-7 rounded-full bg-green-500/15 ring-2 ring-green-500/40 flex items-center justify-center">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    </div>
  ) : isSkipped ? (
    <div className="h-7 w-7 rounded-full bg-amber-500/15 ring-2 ring-amber-500/40 flex items-center justify-center">
      <SkipForward className="h-4 w-4 text-amber-600" />
    </div>
  ) : isPendingSkip ? (
    // Predicted skip — same icon, greyed out until the trigger is committed.
    <div className="h-7 w-7 rounded-full bg-muted ring-2 ring-border flex items-center justify-center">
      <SkipForward className="h-4 w-4 text-muted-foreground" />
    </div>
  ) : isInProgress ? (
    <div className="h-7 w-7 rounded-full bg-accent ring-2 ring-accent/40 flex items-center justify-center">
      <Play className="h-3.5 w-3.5 text-accent-foreground fill-current" />
    </div>
  ) : isLocked ? (
    <div className="h-7 w-7 rounded-full bg-muted ring-2 ring-border flex items-center justify-center">
      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  ) : (
    <div className="h-7 w-7 rounded-full bg-background ring-2 ring-border flex items-center justify-center">
      <Circle className="h-3 w-3 text-muted-foreground" />
    </div>
  );

  return (
    <div
      ref={(el) => {
        if (isActive && el) {
          // best-effort scroll to the active row
          requestAnimationFrame(() => {
            try {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch {}
          });
        }
      }}
      className="relative pl-2"
    >
      {/* Vertical connector line */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[22px] top-9 bottom-[-12px] w-px bg-border"
        />
      )}

      <div
        onClick={handleOpen}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        onKeyDown={(e) => {
          if (isLocked) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={cn(
          "group relative flex items-start gap-3 rounded-lg p-2.5 -ml-2 transition-all",
          !isLocked && "cursor-pointer hover:bg-muted/60",
          isLocked && "opacity-60 cursor-not-allowed",
          isInProgress && "bg-accent/5 ring-1 ring-accent/30"
        )}
      >
        {statusNode}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4
                  className={cn(
                    "text-sm font-medium leading-tight truncate",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && "text-foreground"
                  )}
                >
                  {substitute(step.title)}
                </h4>
                {isInProgress && (
                  <Badge className="h-5 px-1.5 text-[0.65rem] bg-accent text-accent-foreground hover:bg-accent">
                    YOU ARE HERE
                  </Badge>
                )}
                {lens && lensPill[lens] && (
                  <Badge
                    variant="outline"
                    className={cn("h-5 px-1.5 text-[0.65rem] border", lensPill[lens].className)}
                    data-tour={
                      lens === "synthetic_diagnostic"
                        ? "lens-diagnostic"
                        : lens === "synthetic_evidence"
                          ? "lens-evidence"
                          : lens === "trimmed_by_micro"
                            ? "lens-condensed"
                            : undefined
                    }
                  >
                    {lensPill[lens].label}
                  </Badge>
                )}
                {(step.metadata?.micro_learning_for || step.remediationKind === "micro_learning") && (
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[0.65rem] border bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1"
                    data-tour="lens-microlearning"
                    title="Targeted remediation created from the question you missed"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    MICRO-LEARNING
                  </Badge>
                )}
                {step.remediationKind === "gap_module" && (
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[0.65rem] border bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1"
                    title="You passed, but this topic still had a gap — this short module closes it"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    GAP MODULE
                  </Badge>
                )}

                {step.diagResult && (() => {
                  const { correct, total, reopenedCount } = step.diagResult;
                  const allCorrect = correct === total;
                  const noneCorrect = correct === 0;
                  const tone = allCorrect
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : noneCorrect
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
                  const label = allCorrect
                    ? `✓ ${correct}/${total}`
                    : noneCorrect
                      ? `${correct}/${total} · revisit all`
                      : `${correct}/${total} · ${reopenedCount} to revisit`;
                  return (
                    <Badge variant="outline" className={cn("h-5 px-1.5 text-[0.65rem] border font-medium", tone)}>
                      {label}
                    </Badge>
                  );
                })()}
                {step.assessmentScore != null && (() => {
                  const passed = !!step.assessmentPassed;
                  const tone = passed
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/30";
                  return (
                    <Badge
                      variant="outline"
                      className={cn("h-5 px-1.5 text-[0.65rem] border font-medium", tone)}
                      title={
                        step.assessmentPassingScore != null
                          ? `Pass mark ${step.assessmentPassingScore}%`
                          : undefined
                      }
                    >
                      {passed ? "Passed" : "Failed"} · {Math.round(step.assessmentScore)}%
                    </Badge>
                  );
                })()}

              </div>

              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {typeLabel[step.type] ?? "Chapter"}
                </span>
                {step.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {step.duration}
                  </span>
                )}
                {(step.learningFormat === "micro" || step.learningFormat === "micro_refresher") && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                    <Zap className="h-3 w-3" />
                    {step.learningFormat === "micro_refresher" ? "Condensed · Quick refresher" : "Condensed for you"}
                  </span>
                )}
              </div>
            </div>

            {!isInProgress && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreview}
                className={cn(
                  "h-7 px-2 text-xs gap-1 shrink-0 transition-opacity",
                  isLocked
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                )}
              >
                <Eye className="h-3 w-3" />
                Preview
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
