import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { cn } from "@/lib/utils";

interface AssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (score: number, passed: boolean) => void;
  assessmentId?: string;
  skillTargetId?: string;
}

export function AssessmentModal({ open, onClose, onComplete, assessmentId, skillTargetId }: AssessmentModalProps) {
  const { skillTargets, updateSkillTarget } = useSkillTargets();

  // Find the first available assessment from skill targets
  const target = skillTargetId
    ? skillTargets.find((st) => st.id === skillTargetId)
    : skillTargets.find((st) => st.steps.some((s) => s.type === "assessment" && s.status !== "completed"));

  const assessmentStep = target?.steps.find(
    (s) => s.type === "assessment" && (assessmentId ? s.referenceId === assessmentId : s.status !== "completed")
  );

  const topicName = assessmentStep?.title?.replace(/Pre-Assessment:|Post-Assessment:/gi, "").trim()
    || target?.title || "General Knowledge";

  const questions = [
    { id: "q1", question: `What is the primary objective of ${topicName}?`, options: ["Improve team collaboration", "Build core competency in this area", "Reduce operational costs", "Automate workflows"], correctIndex: 1 },
    { id: "q2", question: `Which best describes a key principle of ${topicName}?`, options: ["Avoid feedback loops", "Focus on continuous improvement", "Minimize stakeholder input", "Prioritize speed over quality"], correctIndex: 1 },
    { id: "q3", question: `When applying ${topicName} in practice, you should first:`, options: ["Skip the planning phase", "Assess the current state and gaps", "Implement changes immediately", "Delegate to others"], correctIndex: 1 },
    { id: "q4", question: `A common challenge when developing ${topicName} skills is:`, options: ["Too much training available", "Balancing theory with practice", "Lack of any resources", "No measurable outcomes"], correctIndex: 1 },
    { id: "q5", question: `The best indicator of proficiency in ${topicName} is:`, options: ["Years of experience alone", "Ability to apply concepts in real scenarios", "Number of certifications", "Memorizing definitions"], correctIndex: 1 },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const question = questions[currentQ];
  const totalQuestions = questions.length;
  const answered = Object.keys(answers).length;
  const score = showResults
    ? Math.round((questions.filter((q) => answers[q.id] === q.correctIndex).length / totalQuestions) * 100)
    : 0;
  const passed = score >= 70;

  const handleSelect = (i: number) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [question.id]: i }));
  };

  const handleSubmit = () => {
    setShowResults(true);
    const finalScore = Math.round((questions.filter((q) => answers[q.id] === q.correctIndex).length / totalQuestions) * 100);

    // Update skill target if we found one
    if (target && assessmentStep) {
      updateSkillTarget(target.id, (t) => {
        const updatedSteps = t.steps.map((step) => {
          if (step.referenceId === assessmentStep.referenceId && step.type === "assessment") {
            return { ...step, status: "completed" as const };
          }
          return step;
        });

        const stepsByOrder = [...updatedSteps].sort((a, b) => a.order - b.order);
        const assessmentOrder = stepsByOrder.find((s) => s.referenceId === assessmentStep.referenceId)?.order ?? 0;

        const finalSteps = updatedSteps.map((step) => {
          if (step.order === assessmentOrder + 1) {
            if (finalScore > 80 && step.skippable) return { ...step, status: "skipped" as const };
            return { ...step, status: "available" as const };
          }
          if (step.order === assessmentOrder + 2) {
            if (finalScore >= 90 && step.skippable) return { ...step, status: "skipped" as const };
            if (finalScore > 80) return { ...step, status: "available" as const };
          }
          if (step.order === assessmentOrder + 3 && finalScore >= 90) {
            return { ...step, status: "available" as const };
          }
          return step;
        });

        const completedCount = finalSteps.filter((s) => s.status === "completed" || s.status === "skipped").length;
        const progress = Math.round((completedCount / finalSteps.length) * 100);
        return { ...t, steps: finalSteps, progress };
      });
    }
  };

  const handleDone = () => {
    onComplete(score, passed);
    // Reset state for next time
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
  };

  if (!target || !assessmentStep) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>No Assessment Available</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">There are no pending assessments at this time.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{assessmentStep.title || "Skills Assessment"}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answered / totalQuestions) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{answered}/{totalQuestions}</span>
        </div>

        {showResults ? (
          <div className="text-center py-4">
            <div className={cn("mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full", passed ? "bg-emerald-500/15" : "bg-destructive/15")}>
              {passed ? <CheckCircle2 className="h-7 w-7 text-emerald-500" /> : <XCircle className="h-7 w-7 text-destructive" />}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{score}%</h2>
            <p className={cn("text-sm font-medium mb-4", passed ? "text-emerald-500" : "text-destructive")}>
              {passed ? "Passed!" : "Not yet — keep going!"}
            </p>

            <div className="space-y-2 text-left mb-4">
              {questions.map((q, i) => {
                const correct = answers[q.id] === q.correctIndex;
                return (
                  <div key={q.id} className={cn("rounded-lg border p-2.5 text-sm", correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5")}>
                    <p className="font-medium text-foreground text-xs">{i + 1}. {q.question}</p>
                    <p className={cn("text-[11px] mt-0.5", correct ? "text-emerald-500" : "text-destructive")}>
                      {correct ? "✓ Correct" : `✗ ${q.options[answers[q.id]]} → ${q.options[q.correctIndex]}`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-center">
              <button onClick={handleRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </button>
              <button onClick={handleDone} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Question {currentQ + 1} of {totalQuestions}</p>
            <h3 className="text-sm font-semibold text-foreground mb-4">{question.question}</h3>

            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left text-sm transition-all",
                    answers[question.id] === i
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium", answers[question.id] === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-between">
              <button onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                Previous
              </button>
              {currentQ === totalQuestions - 1 ? (
                <button onClick={handleSubmit} disabled={answered < totalQuestions} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity">
                  Submit
                </button>
              ) : (
                <button onClick={() => setCurrentQ((p) => p + 1)} className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
