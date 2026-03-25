import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

import { mockAssessments } from "@/data/mock";
import { st2BaselineAssessment, st2MidAssessment, st2FinalAssessment } from "@/data/rathbonesOnboarding";
import { cn } from "@/lib/utils";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { emitAssessmentCompleted } from "@/lib/agentOneEventEmitter";

export default function AssessmentPage() {
  const { aid, id: skillTargetId } = useParams();
  const { updateSkillTarget, skillTargets } = useSkillTargets();
  const { activeAccount, normalizedAccount } = useAccount();
  const { user } = useUser();

  // Deduplicate: ensure Rathbones assessments are always present regardless of import order
  const rathbonesAssessments = [st2BaselineAssessment, st2MidAssessment, st2FinalAssessment];
  const rathbonesIds = new Set(rathbonesAssessments.map(a => a.id));
  const allAssessments = [...mockAssessments.filter(a => !rathbonesIds.has(a.id)), ...rathbonesAssessments];
  // Try direct assessment ID match first, then resolve via step referenceId
  let foundAssessment = allAssessments.find((a) => a.id === aid);
  if (!foundAssessment) {
    // Search across all skill targets (context + any loaded targets) for a step whose ID matches aid
    for (const target of skillTargets) {
      const stepByStepId = target.steps.find((s) => s.id === aid && s.type === "assessment");
      if (stepByStepId) {
        foundAssessment = allAssessments.find((a) => a.id === stepByStepId.referenceId);
        break;
      }
    }
  }
  // Static fallback map for known Rathbones step IDs → assessment IDs
  if (!foundAssessment) {
    const STEP_TO_ASSESSMENT: Record<string, string> = {
      "RAT-ASM-001": "a-rb-st2-baseline",
      "RAT-ASM-002": "a-rb-st2-mid",
      "RAT-ASM-003": "a-rb-st2-final",
    };
    const mappedId = STEP_TO_ASSESSMENT[aid ?? ""];
    if (mappedId) {
      foundAssessment = allAssessments.find((a) => a.id === mappedId);
    }
  }

  // Generate fallback assessment from skill target step data when not in mock catalog
  const assessment = foundAssessment ?? (() => {
    const target = skillTargets.find((st) => st.id === skillTargetId);
    const step = target?.steps.find((s) => s.referenceId === aid);
    if (!step) return null;
    const topicName = step.title.replace(/Pre-Assessment:|Post-Assessment:/gi, "").trim() || target?.title || "General Knowledge";
    return {
      id: aid!,
      title: step.title,
      type: (step.title.toLowerCase().includes("pre") ? "pre" : "post") as "pre" | "post",
      passingScore: 70,
      questions: [
        { id: `${aid}-q1`, question: `What is the primary objective of ${topicName}?`, options: ["Improve team collaboration", "Build core competency in this area", "Reduce operational costs", "Automate workflows"], correctIndex: 1 },
        { id: `${aid}-q2`, question: `Which of the following best describes a key principle of ${topicName}?`, options: ["Avoid feedback loops", "Focus on continuous improvement", "Minimize stakeholder input", "Prioritize speed over quality"], correctIndex: 1 },
        { id: `${aid}-q3`, question: `When applying ${topicName} in practice, you should first:`, options: ["Skip the planning phase", "Assess the current state and gaps", "Implement changes immediately", "Delegate to others"], correctIndex: 1 },
        { id: `${aid}-q4`, question: `What is a common challenge when developing skills in ${topicName}?`, options: ["Too much available training", "Balancing theory with practice", "Lack of any resources", "No measurable outcomes"], correctIndex: 1 },
        { id: `${aid}-q5`, question: `The best indicator of proficiency in ${topicName} is:`, options: ["Years of experience alone", "Ability to apply concepts in real scenarios", "Number of certifications", "Memorizing definitions"], correctIndex: 1 },
      ],
    };
  })();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (!assessment) {
    return (
      <div>
        <div className="flex items-center justify-center p-20 text-muted-foreground">
          Assessment not found.
        </div>
      </div>
    );
  }

  const question = assessment.questions[currentQ];
  const totalQuestions = assessment.questions.length;
  const answered = Object.keys(answers).length;

  const score = showResults
    ? Math.round(
        (assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length /
          totalQuestions) *
          100
      )
    : 0;
  const passed = score >= assessment.passingScore;

  const handleSelect = (optionIndex: number) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
  };

  /* ─── Explicit Assessment Gate Map ─── */
  interface GateAction { skip?: string[]; unlock?: string[]; complete?: string[]; reset?: string[]; retryId?: string }
  const GATE_MAP: Record<string, {
    onPass: GateAction;
    onFail: GateAction;
    passThreshold: number;
  }> = {
    "a-rb-st2-baseline": {
      passThreshold: 80,
      onPass: {
        complete: ["RAT-ASM-001"],
        skip: ["RAT-LM-001", "RAT-LM-002", "RAT-LM-003"],
        unlock: ["RAT-LM-004"],
      },
      onFail: {
        complete: ["RAT-ASM-001"],
        unlock: ["RAT-LM-001"],
      },
    },
    "a-rb-st2-mid": {
      passThreshold: 80,
      onPass: {
        complete: ["RAT-ASM-002"],
        unlock: ["RAT-RP-001"],
      },
      onFail: {
        reset: ["RAT-LM-004", "RAT-LM-005", "RAT-LM-006", "RAT-LM-007"],
        retryId: "RAT-ASM-002",
      },
    },
    "a-rb-st2-final": {
      passThreshold: 80,
      onPass: {
        complete: ["RAT-ASM-003"],
      },
      onFail: {
        reset: ["RAT-RP-001"],
        retryId: "RAT-ASM-003",
      },
    },
  };

  const handleSubmit = () => {
    setShowResults(true);

    if (!assessment || !skillTargetId) return;

    const finalScore = Math.round(
      (assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length /
        assessment.questions.length) *
        100
    );

    // Emit assessment event
    if (activeAccount?.id && normalizedAccount && aid) {
      emitAssessmentCompleted(
        user.id,
        aid,
        finalScore,
        activeAccount.id,
        normalizedAccount
      ).catch(console.error);
    }

    const gate = GATE_MAP[assessment.id];

    updateSkillTarget(skillTargetId, (target) => {
      // Mark the assessment step itself as completed
      let updatedSteps = target.steps.map((step) => {
        if (step.referenceId === assessment.id && step.type === "assessment") {
          return { ...step, status: "completed" as const };
        }
        return step;
      });

      if (gate) {
        const passed = finalScore >= gate.passThreshold;
        const actions = passed ? gate.onPass : gate.onFail;

        updatedSteps = updatedSteps.map((step) => {
          if (actions.complete?.includes(step.id)) return { ...step, status: "completed" as const };
          if (actions.skip?.includes(step.id)) return { ...step, status: "skipped" as const };
          if (actions.unlock?.includes(step.id)) return { ...step, status: "available" as const };
          if (actions.reset?.includes(step.id)) return { ...step, status: "available" as const };
          if (!passed && actions.retryId === step.id) return { ...step, status: "available" as const };
          return step;
        });
      } else {
        // Fallback: unlock the next locked step after this assessment
        const assessmentStep = updatedSteps.find(
          (s) => s.referenceId === assessment.id && s.type === "assessment"
        );
        if (assessmentStep) {
          const sorted = [...updatedSteps].sort((a, b) => a.order - b.order);
          const nextLocked = sorted.find((s) => s.order > assessmentStep.order && s.status === "locked");
          if (nextLocked) {
            updatedSteps = updatedSteps.map((s) =>
              s.id === nextLocked.id ? { ...s, status: "available" as const } : s
            );
          }
        }
      }

      const completedCount = updatedSteps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      const progress = Math.round((completedCount / updatedSteps.length) * 100);

      return { ...target, steps: updatedSteps, progress };
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowResults(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      
      <div className="mx-auto max-w-2xl p-6">
        <Link
          to={`/skill-target/${skillTargetId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Skill Target
        </Link>

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
            <span className="text-xs text-muted-foreground">
              Passing: {assessment.passingScore}%
            </span>
          </div>
          <h1 className="font-display text-lg font-bold text-foreground">{assessment.title}</h1>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full gradient-accent transition-all duration-300"
                style={{ width: `${(answered / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {answered}/{totalQuestions}
            </span>
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
              {passed ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              {score}%
            </h2>
            <p className={cn("text-sm font-medium mb-1", passed ? "text-success" : "text-destructive")}>
              {passed ? "Passed!" : "Not yet — keep going!"}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              You got {assessment.questions.filter((q) => answers[q.id] === q.correctIndex).length} of{" "}
              {totalQuestions} correct. {passed && assessment.type === "pre" ? "Some modules may be skippable based on your score." : ""}
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
                    <p className="font-medium text-foreground">
                      {i + 1}. {q.question}
                    </p>
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
              <Link
                to={`/skill-target/${skillTargetId}`}
                className="inline-flex items-center gap-2 rounded-lg gradient-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
              >
                Continue
              </Link>
            </div>
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
            <p className="text-xs text-muted-foreground mb-3">
              Question {currentQ + 1} of {totalQuestions}
            </p>
            <h3 className="font-display text-base font-semibold text-foreground mb-5">
              {question.question}
            </h3>

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
                    {option}
                  </span>
                </button>
              ))}
            </div>

            {/* Nav buttons */}
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
