import { useState } from "react";
import { useLearnPath } from "@/contexts/LearnPathContext";
import { expandedModules } from "@/data/contentModules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Generate simple quiz questions from module content
function generateQuestions(moduleTitle: string) {
  return [
    {
      id: "q1",
      question: `What is the primary focus of "${moduleTitle}"?`,
      options: [
        "Understanding core concepts and best practices",
        "Advanced coding techniques",
        "Marketing strategy development",
        "Financial reporting standards",
      ],
      correctIndex: 0,
    },
    {
      id: "q2",
      question: "Which of the following best describes the key takeaway?",
      options: [
        "Ignore established processes",
        "Apply structured approaches for consistent outcomes",
        "Rely solely on intuition",
        "Avoid documentation",
      ],
      correctIndex: 1,
    },
    {
      id: "q3",
      question: "How should you apply what you've learned?",
      options: [
        "Only in theory, never in practice",
        "Wait for someone else to implement it",
        "Practice regularly and seek feedback",
        "Only during formal assessments",
      ],
      correctIndex: 2,
    },
  ];
}

export function LearnPathAssessment({ moduleId }: { moduleId: string }) {
  const { closeAssessment } = useLearnPath();
  const module = expandedModules.find((m) => m.id === moduleId);
  const questions = generateQuestions(module?.title ?? "this module");

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      <Button variant="ghost" size="sm" onClick={closeAssessment} className="gap-1 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Module
      </Button>

      <h2 className="text-lg font-bold text-foreground mb-1">Quick Assessment</h2>
      <p className="text-sm text-muted-foreground mb-6">{module?.title}</p>

      {submitted && (
        <Card className="mb-6 border-accent/30">
          <CardContent className="p-4 flex items-center gap-3">
            {score >= 2 ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                Score: {score}/{questions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {score >= 2 ? "Great work! You've demonstrated understanding." : "Review the module and try again."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {qi + 1}. {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrong = submitted && selected && oi !== q.correctIndex;
                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    disabled={submitted}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm border transition-colors",
                      selected && !submitted && "border-accent bg-accent/10",
                      isCorrect && "border-green-500 bg-green-500/10",
                      isWrong && "border-destructive bg-destructive/10",
                      !selected && !isCorrect && "border-border hover:bg-muted"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {!submitted && (
        <Button
          className="mt-6 w-full"
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Submit Answers
        </Button>
      )}
    </div>
  );
}
