import { useState } from "react";
import { Maximize2, X, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { mockAssessments } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { StepItem } from "@/types/learning";

interface TraditionalContentViewerProps {
  step: StepItem;
  onClose: () => void;
  skillTargetId?: string;
}

export function TraditionalContentViewer({ step, onClose, skillTargetId }: TraditionalContentViewerProps) {
  const isAssessment = step.type === "assessment";
  const assessment = isAssessment ? mockAssessments.find((a) => a.id === step.referenceId) : null;

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
          <AssessmentViewer assessment={assessment} step={step} />
        ) : (
          <DefaultContentViewer step={step} />
        )}
      </div>
    </div>
  );
}

// ── Assessment viewer (inline quiz) ──
import type { Assessment } from "@/types/learning";

function AssessmentViewer({ assessment, step }: { assessment: Assessment; step: StepItem }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

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

  const handleSubmit = () => setShowResults(true);

  const handleRetry = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowResults(false);
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

          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
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
                {option}
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
function DefaultContentViewer({ step }: { step: StepItem }) {
  return (
    <>
      <div className="aspect-video bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">▶</span>
          </div>
          <p className="text-sm text-muted-foreground">Content preview</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{step.description}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-muted-foreground mb-2">Cornerstone</p>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-base font-semibold text-foreground mt-3">{step.title}</h3>
        {step.duration && <p className="text-xs text-muted-foreground mt-1">Duration: {step.duration}</p>}
      </div>
    </>
  );
}
