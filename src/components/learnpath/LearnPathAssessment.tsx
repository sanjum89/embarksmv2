import { useState } from "react";
import { useEmbark } from "@/contexts/LearnPathContext";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { resolveAssessment, applyGateActions, STEP_TO_ASSESSMENT } from "@/lib/assessmentGates";
import { emitAssessmentCompleted } from "@/lib/agentOneEventEmitter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { StepType } from "@/types/learning";

interface Props {
  assessmentId: string;
  skillTargetId?: string;
  stepId?: string;
  nextStepId?: string;
  nextStepTitle?: string;
  nextStepType?: StepType;
  nextSkillTargetId?: string;
}

export function EmbarkAssessment({
  assessmentId,
  skillTargetId,
  stepId,
  nextStepId,
  nextStepTitle,
  nextStepType,
  nextSkillTargetId,
}: Props) {
  const { closeAssessment, openModule, openAssessment: openNextAssessment, showModuleGrid } = useEmbark();
  const { skillTargets, updateSkillTarget } = useSkillTargets();
  const { activeAccount, normalizedAccount } = useAccount();
  const { user } = useUser();

  // Resolve the assessment using shared logic
  const resolvedId = STEP_TO_ASSESSMENT[assessmentId] ?? assessmentId;
  const assessment = resolveAssessment(resolvedId, skillTargets);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (!assessment) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Assessment not found.
      </div>
    );
  }

  const totalQuestions = assessment.questions.length;
  const answered = Object.keys(answers).length;
  const question = assessment.questions[currentQ];

  const score = showResults
    ? Math.round(
        (assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length /
          totalQuestions) *
          100
      )
    : 0;
  const passed = showResults && score >= assessment.passingScore;

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
      (assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length /
        totalQuestions) *
        100
    );

    // Emit event
    if (activeAccount?.id && normalizedAccount && assessmentId) {
      emitAssessmentCompleted(user.id, assessmentId, finalScore, activeAccount.id, normalizedAccount).catch(console.error);
    }

    // Apply gate logic
    if (skillTargetId) {
      updateSkillTarget(skillTargetId, (target) => {
        const result = applyGateActions(target.steps, assessment.id, finalScore);
        return { ...target, steps: result.steps, progress: result.progress };
      });
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowResults(false);
  };

  const handleContinue = () => {
    if (nextStepId) {
      if (nextStepType === "assessment") {
        openNextAssessment(nextStepId);
      } else {
        openModule(nextStepId, nextSkillTargetId);
      }
    } else {
      showModuleGrid();
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-6">
        <Button variant="ghost" size="sm" onClick={closeAssessment} className="gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border p-5 shadow-card mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              assessment.type === "pre" ? "bg-info/10 text-info" : "bg-accent/10 text-accent"
            )}>
              {assessment.type === "pre" ? "Pre-Assessment" : "Post-Assessment"}
            </span>
            <span className="text-xs text-muted-foreground">Passing: {assessment.passingScore}%</span>
          </div>
          <h1 className="font-display text-lg font-bold text-foreground">{assessment.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full gradient-accent transition-all duration-300"
                style={{ width: `${(answered / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{answered}/{totalQuestions}</span>
          </div>
        </motion.div>

        {/* Results */}
        {showResults ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-card border border-border p-8 shadow-card text-center"
          >
            <div className={cn(
              "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
              passed ? "bg-success/15" : "bg-destructive/15"
            )}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-success" /> : <XCircle className="h-8 w-8 text-destructive" />}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">{score}%</h2>
            <p className={cn("text-sm font-medium mb-1", passed ? "text-success" : "text-destructive")}>
              {passed ? "Passed!" : "Not yet — keep going!"}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              You got {assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length} of {totalQuestions} correct.
              {passed && assessment.type === "pre" ? " Some modules may be skippable based on your score." : ""}
            </p>

            {/* Per-question results */}
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
                    <p className="font-medium text-foreground">{i + 1}. {q.question}</p>
                    <p className={cn("text-xs mt-1", correct ? "text-success" : "text-destructive")}>
                      {correct ? "✓ Correct" : `✗ Your answer: ${q.options[answers[q.id]]} — Correct: ${q.options[q.correctIndex]}`}
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
                className="inline-flex items-center gap-2 rounded-lg gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
              >
                {nextStepId ? "Continue" : "All Chapters"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Next up preview */}
            {nextStepId && nextStepTitle && (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-left">
                <p className="text-xs text-muted-foreground mb-0.5">Next Up</p>
                <p className="text-sm font-medium text-foreground">{nextStepTitle}</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Question card */
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl bg-card border border-border p-6 shadow-card"
          >
            <p className="text-xs text-muted-foreground mb-3">Question {currentQ + 1} of {totalQuestions}</p>
            <h3 className="font-display text-base font-semibold text-foreground mb-5">{question.question}</h3>

            <div className="space-y-2.5">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "w-full rounded-lg border p-3.5 text-left text-sm transition-all duration-200",
                    answers[question.id] === i
                      ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent/30"
                      : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-accent/5"
                  )}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      answers[question.id] === i ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
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
                  className="rounded-lg gradient-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
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
        )}
      </div>
    </div>
  );
}
