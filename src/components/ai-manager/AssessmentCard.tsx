import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assessmentQuestions } from "@/data/aiManagerFlow";
import { cn } from "@/lib/utils";

interface AssessmentCardProps {
  onComplete: (score: number) => void;
}

export function AssessmentCard({ onComplete }: AssessmentCardProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? Math.round(
        (assessmentQuestions.filter((q, i) => answers[i] === q.correct).length /
          assessmentQuestions.length) *
          100
      )
    : 0;

  const handleSubmit = () => {
    if (Object.keys(answers).length < assessmentQuestions.length) return;
    setSubmitted(true);
    const s = Math.round(
      (assessmentQuestions.filter((q, i) => answers[i] === q.correct).length /
        assessmentQuestions.length) *
        100
    );
    onComplete(s);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm max-w-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Baseline Assessment</span>
      </div>

      <div className="space-y-4">
        {assessmentQuestions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-medium text-foreground mb-2">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const isCorrect = submitted && oi === q.correct;
                const isWrong = submitted && selected && oi !== q.correct;
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2 text-xs transition-all",
                      submitted
                        ? isCorrect
                          ? "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)] text-foreground"
                          : isWrong
                          ? "border-destructive bg-destructive/5 text-foreground"
                          : "border-border text-muted-foreground"
                        : selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:border-primary/30 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("flex-1", oi === q.correct && "font-medium")}>{opt}</span>
                      {submitted && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />}
                      {submitted && isWrong && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <Button
          size="sm"
          className="mt-4 w-full"
          disabled={Object.keys(answers).length < assessmentQuestions.length}
          onClick={handleSubmit}
        >
          Submit Assessment
        </Button>
      ) : (
        <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{score}%</p>
          <p className="text-xs text-muted-foreground">
            {score >= 80 ? "Great job! You passed!" : "Keep learning — you'll get there!"}
          </p>
        </div>
      )}
    </motion.div>
  );
}
