import { useState } from "react";
import { Maximize2, X, ThumbsUp, ThumbsDown, RotateCcw, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { mockAssessments as defaultAssessments } from "@/data/mock";
import { st2BaselineAssessment, st2MidAssessment, st2FinalAssessment } from "@/data/rathbonesOnboarding";
import { useAccount } from "@/contexts/AccountContext";
import { cn } from "@/lib/utils";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { resolveModule } from "@/lib/learnPathModuleResolver";
import ReactMarkdown from "react-markdown";
import type { StepItem, Assessment } from "@/types/learning";

interface TraditionalContentViewerProps {
  step: StepItem;
  onClose: () => void;
  skillTargetId: string;
  allSteps: StepItem[];
  onNavigateToStep: (step: StepItem) => void;
}

export function TraditionalContentViewer({ step, onClose, skillTargetId, allSteps, onNavigateToStep }: TraditionalContentViewerProps) {
  const isAssessment = step.type === "assessment";
  const { normalizedAccount } = useAccount();
  const rathbonesAssessments = [st2BaselineAssessment, st2MidAssessment, st2FinalAssessment];
  const rathbonesIds = new Set(rathbonesAssessments.map(a => a.id));
  const baseAssessments = normalizedAccount?.assessments?.length ? normalizedAccount.assessments : defaultAssessments;
  const assessments = [...(baseAssessments as Assessment[]).filter(a => !rathbonesIds.has(a.id)), ...rathbonesAssessments];
  const assessment = isAssessment ? assessments.find((a) => a.id === step.referenceId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{step.title}</h2>
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isAssessment && assessment ? (
          <AssessmentViewer
            assessment={assessment}
            step={step}
            skillTargetId={skillTargetId}
            allSteps={allSteps}
            onNavigateToStep={onNavigateToStep}
          />
        ) : (
          <DefaultContentViewer
            step={step}
            skillTargetId={skillTargetId}
            allSteps={allSteps}
            onNavigateToStep={onNavigateToStep}
          />
        )}
      </div>
    </div>
  );
}

// ── Assessment viewer (inline quiz) ──
function AssessmentViewer({
  assessment,
  step,
  skillTargetId,
  allSteps,
  onNavigateToStep,
}: {
  assessment: Assessment;
  step: StepItem;
  skillTargetId: string;
  allSteps: StepItem[];
  onNavigateToStep: (step: StepItem) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const { updateSkillTarget } = useSkillTargets();

  const question = assessment.questions[currentQ];
  const totalQuestions = assessment.questions.length;
  const answered = Object.keys(answers).length;

  const score = showResults
    ? Math.round(
        (assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length / totalQuestions) * 100
      )
    : 0;
  const passed = score >= assessment.passingScore;

  const handleSelect = (optionIndex: number) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQ < totalQuestions - 1) setCurrentQ((p) => p + 1);
  };
  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ((p) => p - 1);
  };

  const handleSubmit = () => {
    setShowResults(true);

    const finalScore = Math.round(
      (assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length / totalQuestions) * 100
    );

    updateSkillTarget(skillTargetId, (target) => {
      const updatedSteps = target.steps.map((s) => {
        if (s.referenceId === assessment.id && s.type === "assessment") {
          return { ...s, status: "completed" as const };
        }
        return s;
      });

      const stepsByOrder = [...updatedSteps].sort((a, b) => a.order - b.order);
      const assessmentOrder = stepsByOrder.find(
        (s) => s.referenceId === assessment.id && s.type === "assessment"
      )?.order ?? 0;

      const finalSteps = updatedSteps.map((s) => {
        if (s.order === assessmentOrder + 1) {
          if (finalScore > 80 && s.skippable) {
            return { ...s, status: "skipped" as const };
          }
          return { ...s, status: "available" as const };
        }
        if (s.order === assessmentOrder + 2) {
          if (finalScore >= 90 && s.skippable) {
            return { ...s, status: "skipped" as const };
          }
          if (finalScore > 80) {
            return { ...s, status: "available" as const };
          }
        }
        if (s.order === assessmentOrder + 3 && finalScore >= 90) {
          return { ...s, status: "available" as const };
        }
        return s;
      });

      const completedCount = finalSteps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      const progress = Math.round((completedCount / finalSteps.length) * 100);

      return { ...target, steps: finalSteps, progress };
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowResults(false);
  };

  const getNextAvailableStep = () => {
    // Re-read from context after update — use allSteps as fallback for ordering
    const sortedSteps = [...allSteps].sort((a, b) => a.order - b.order);
    const currentOrder = step.order;
    return sortedSteps.find((s) => s.order > currentOrder && s.status !== "locked");
  };

  const handleContinue = () => {
    // We need fresh steps from context, so find next non-locked step after current
    const sortedSteps = [...allSteps].sort((a, b) => a.order - b.order);
    const currentOrder = step.order;
    const nextStep = sortedSteps.find(
      (s) => s.order > currentOrder && (s.status === "available" || s.status === "completed" || s.status === "skipped")
    );
    if (nextStep) {
      onNavigateToStep(nextStep);
    }
  };

  if (showResults) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-background border border-border p-8 text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
              passed ? "bg-success/15" : "bg-destructive/15"
            )}
          >
            <span className={cn("text-2xl font-bold", passed ? "text-success" : "text-destructive")}>
              {score}%
            </span>
          </div>
          <p className={cn("text-sm font-medium mb-1", passed ? "text-success" : "text-destructive")}>
            {passed ? "Passed!" : "Not yet — keep going!"}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            You got {assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length} of{" "}
            {totalQuestions} correct.
            {passed && assessment.type === "pre" ? " Some modules may be skippable based on your score." : ""}
          </p>

          {/* Per-question review */}
          <div className="space-y-2 text-left mb-6">
            {assessment.questions.map((q, i) => {
              const correct = answers[q.id] === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    correct ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <p className="font-medium text-foreground">
                    {i + 1}. {q.question}
                  </p>
                  <p className={cn("text-xs mt-1", correct ? "text-success" : "text-destructive")}>
                    {correct
                      ? "✓ Correct"
                      : `✗ Your answer: ${q.options[answers[q.id]]} — Correct: ${q.options[q.correctIndex]}`}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Retry
            </button>
            <button
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Assessment badge */}
      <div className="flex items-center justify-between mb-5">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            assessment.type === "pre" ? "bg-info/10 text-info" : "bg-accent/10 text-accent"
          )}
        >
          {assessment.type === "pre" ? "Pre-Assessment" : "Post-Assessment"}
        </span>
        <span className="text-xs text-muted-foreground">Passing: {assessment.passingScore}%</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(answered / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {answered}/{totalQuestions}
        </span>
      </div>

      {/* Question card */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl bg-background border border-border p-5"
      >
        <p className="text-xs text-muted-foreground mb-3">
          Question {currentQ + 1} of {totalQuestions}
        </p>
        <h3 className="text-sm font-semibold text-foreground mb-4">{question.question}</h3>

        <div className="space-y-2">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={cn(
                "w-full rounded-lg border p-3 text-left text-sm transition-all duration-200",
                answers[question.id] === i
                  ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <span className="inline-flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    answers[question.id] === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={cn("leading-snug", i === question.correctIndex && "font-medium")}>{option}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQ === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          {currentQ === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={answered < totalQuestions}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Default content viewer for modules/role plays ──
function DefaultContentViewer({
  step,
  skillTargetId,
  allSteps,
  onNavigateToStep,
}: {
  step: StepItem;
  skillTargetId: string;
  allSteps: StepItem[];
  onNavigateToStep: (step: StepItem) => void;
}) {
  const [completed, setCompleted] = useState(step.status === "completed");
  const { updateSkillTarget, skillTargets } = useSkillTargets();
  const { normalizedAccount } = useAccount();

  // Resolve the module to get transcript content
  const moduleId = step.referenceId ?? step.id;
  const resolvedModule = step.type === "module"
    ? resolveModule(moduleId, skillTargets, normalizedAccount?.learningModules)
    : undefined;
  const transcript = resolvedModule?.transcript;

  const handleMarkComplete = () => {
    setCompleted(true);
    updateSkillTarget(skillTargetId, (target) => {
      const updatedSteps = target.steps.map((s) => {
        if (s.id === step.id) {
          return { ...s, status: "completed" as const };
        }
        return s;
      });

      const sortedSteps = [...updatedSteps].sort((a, b) => a.order - b.order);
      const currentOrder = step.order;
      const nextLocked = sortedSteps.find((s) => s.order > currentOrder && s.status === "locked");

      const finalSteps = nextLocked
        ? updatedSteps.map((s) =>
            s.id === nextLocked.id ? { ...s, status: "available" as const } : s
          )
        : updatedSteps;

      const completedCount = finalSteps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      const progress = Math.round((completedCount / finalSteps.length) * 100);

      return { ...target, steps: finalSteps, progress };
    });
  };

  const handleContinue = () => {
    const sortedSteps = [...allSteps].sort((a, b) => a.order - b.order);
    const currentOrder = step.order;
    const nextStep = sortedSteps.find(
      (s) => s.order > currentOrder && (s.status === "available" || s.status === "completed" || s.status === "skipped")
    );
    if (nextStep) {
      onNavigateToStep(nextStep);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Module Complete!</h3>
        <p className="text-sm text-muted-foreground mb-6">Great work. Keep going!</p>
        <button
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const isDocument = resolvedModule?.contentType === "document";

  return (
    <>
      {/* Header with title and Mark as Complete */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
          <button
            onClick={handleMarkComplete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Complete
          </button>
        </div>
        {step.duration && <p className="text-xs text-muted-foreground mt-1">Duration: {step.duration}</p>}
      </div>

      {/* Video preview — only for video content */}
      {!isDocument && (
        <div className="aspect-video bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-background shadow-md flex items-center justify-center">
              <span className="text-lg ml-0.5">▶</span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Preview</p>
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="px-5 py-5">
        {transcript ? (
          <div className="rounded-xl border border-border bg-card p-5">
            {!isDocument && <h4 className="text-sm font-semibold text-foreground mb-3">Transcript</h4>}
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <ReactMarkdown>{transcript}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">Content</h4>
            <p className="text-sm text-muted-foreground">
              {step.description || `This module covers ${step.title}.`}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
