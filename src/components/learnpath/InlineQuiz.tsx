import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface InlineQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  /** When the quiz is module-scoped (Quick Diagnostic), each question
   * carries the chapter it was sourced from so we know which chapter to
   * reopen on a wrong answer. */
  chapterCode?: string;
}

export interface InlineQuizSubmitResult {
  total: number;
  correctCount: number;
  allCorrect: boolean;
  /** Chapter codes for questions answered incorrectly. Deduplicated. */
  wrongChapterCodes: string[];
}

interface Props {
  title?: string;
  questions: InlineQuizQuestion[];
  /** Fires once when the learner has answered every question correctly (passed). */
  onPass?: () => void;
  /** Fires once on submit, regardless of pass/fail. Used by Quick Diagnostic
   * to mark the diagnostic complete and reopen wrong chapters. */
  onSubmit?: (result: InlineQuizSubmitResult) => void;
}

export function InlineQuiz({ title, questions, onPass, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasFiredPass, setHasFiredPass] = useState(false);
  const [hasFiredSubmit, setHasFiredSubmit] = useState(false);

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const allAnswered = answeredCount === total;
  const allCorrect = submitted && correctCount === total;

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    if (correctCount === total && !hasFiredPass) {
      setHasFiredPass(true);
      onPass?.();
    }
    if (!hasFiredSubmit) {
      setHasFiredSubmit(true);
      const wrongChapterCodes = Array.from(
        new Set(
          questions
            .map((q, i) => (answers[i] !== q.correctIndex ? q.chapterCode : undefined))
            .filter((c): c is string => !!c),
        ),
      );
      onSubmit?.({
        total,
        correctCount,
        allCorrect: correctCount === total,
        wrongChapterCodes,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-card overflow-hidden my-4">
      <div
        className="px-5 py-4 flex items-center gap-2.5"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent) / 0.10), hsl(var(--primary) / 0.05))",
        }}
      >
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">
          {title ?? "Quick Check"}
        </span>
        {submitted && (
          <span
            className={cn(
              "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
              allCorrect
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            )}
          >
            {correctCount} / {total} correct
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {questions.map((q, qIdx) => {
          const selected = answers[qIdx];
          const isCorrect = submitted && selected === q.correctIndex;
          const isWrong = submitted && selected != null && selected !== q.correctIndex;
          return (
            <div key={qIdx} className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="h-6 w-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {q.question}
                </p>
              </div>
              <div className="space-y-1.5 pl-8">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  const showCorrect = submitted && optIdx === q.correctIndex;
                  const showWrongPick = submitted && isSelected && optIdx !== q.correctIndex;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      disabled={submitted}
                      className={cn(
                        "w-full text-left text-sm rounded-lg border px-3 py-2.5 transition-colors flex items-center gap-2.5",
                        !submitted && isSelected && "border-primary bg-primary/5 text-foreground",
                        !submitted && !isSelected && "border-border bg-card hover:bg-muted/50 text-foreground",
                        showCorrect && "border-success bg-success/10 text-foreground",
                        showWrongPick && "border-destructive bg-destructive/10 text-foreground",
                        submitted && !showCorrect && !showWrongPick && "border-border bg-card text-muted-foreground opacity-70",
                        submitted && "cursor-default"
                      )}
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                          !submitted && isSelected && "border-primary bg-primary",
                          !submitted && !isSelected && "border-muted-foreground/40",
                          showCorrect && "border-success bg-success",
                          showWrongPick && "border-destructive bg-destructive",
                          submitted && !showCorrect && !showWrongPick && "border-muted-foreground/30"
                        )}
                      >
                        {showCorrect && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
                        {showWrongPick && <XCircle className="h-3 w-3 text-destructive-foreground" />}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <div
                  className={cn(
                    "ml-8 rounded-lg border px-3 py-2 flex gap-2 text-xs leading-relaxed",
                    isCorrect
                      ? "border-success/30 bg-success/5 text-foreground"
                      : "border-accent/30 bg-accent/5 text-foreground"
                  )}
                >
                  <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
                  <span>
                    <span className="font-semibold">
                      {isCorrect ? "Correct. " : "Why: "}
                    </span>
                    {q.explanation}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {!submitted
              ? `${answeredCount} of ${total} answered`
              : allCorrect
                ? "Nice — you've got this. Module marked complete."
                : "We've reopened the chapters you missed so you can read them next."}
          </p>
          {!submitted && (
            <Button size="sm" onClick={handleSubmit} disabled={!allAnswered}>
              Submit answers
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const RICH_BLOCK_RE = /:::RICH_BLOCK(\{[\s\S]*?\}):::/g;

export interface ParsedInlineQuiz {
  title?: string;
  questions: InlineQuizQuestion[];
}

/**
 * Extract `inline_quiz` rich blocks from a markdown transcript and return the
 * cleaned text plus the parsed quiz definitions.
 * All RICH_BLOCK markers are stripped from the cleaned text — even ones we
 * don't render here — so learners never see raw JSON.
 */
export function extractInlineQuizzes(transcript: string): {
  cleanText: string;
  quizzes: ParsedInlineQuiz[];
} {
  if (!transcript) return { cleanText: "", quizzes: [] };
  const quizzes: ParsedInlineQuiz[] = [];
  const cleanText = transcript.replace(RICH_BLOCK_RE, (_match, json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed?.type === "inline_quiz" && Array.isArray(parsed?.data?.questions)) {
        quizzes.push({
          title: parsed.data.title,
          questions: parsed.data.questions
            .filter((q: any) => q && Array.isArray(q.options) && typeof q.question === "string")
            .map((q: any) => ({
              question: q.question,
              options: q.options,
              correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
              explanation: q.explanation,
            })),
        });
      }
    } catch {
      // ignore malformed block
    }
    return "";
  });
  return { cleanText: cleanText.replace(/\n{3,}/g, "\n\n").trim(), quizzes };
}
