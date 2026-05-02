import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const QUESTIONS: Question[] = [
  // Investment Proposition & Client Outcomes (Q1-3)
  {
    id: "q1",
    topic: "Investment Proposition & Client Outcomes",
    question: "What is the primary service model used in discretionary wealth management?",
    options: [
      "The client selects their own investments from a curated list",
      "A dedicated manager constructs and manages a bespoke portfolio on the client's behalf",
      "An algorithm automatically rebalances a pre-set model portfolio",
      "The adviser recommends trades that the client must approve individually",
    ],
    correctIndex: 1,
  },
  {
    id: "q2",
    topic: "Investment Proposition & Client Outcomes",
    question: "How are client outcomes best measured in a discretionary mandate?",
    options: [
      "By comparing performance to a broad market index",
      "Against the individual client's stated objectives and agreed risk parameters",
      "By the total return generated over the calendar year",
      "Through peer-group ranking of similar portfolios",
    ],
    correctIndex: 1,
  },
  {
    id: "q3",
    topic: "Investment Proposition & Client Outcomes",
    question: "What distinguishes a discretionary service from a platform-based investment model?",
    options: [
      "Lower fees and automated rebalancing",
      "Access to a wider range of passive funds",
      "Bespoke portfolio construction tailored to each client's circumstances",
      "The ability to trade in real-time via a mobile app",
    ],
    correctIndex: 2,
  },
  // Client Risk Profiles & Objectives (Q4-6)
  {
    id: "q4",
    topic: "Client Risk Profiles & Objectives",
    question: "When assessing a new client's risk tolerance, the most important factor is:",
    options: [
      "Their age and expected retirement date",
      "Their capacity for loss relative to financial goals",
      "The amount of capital they wish to invest",
      "Their previous investment experience",
    ],
    correctIndex: 1,
  },
  {
    id: "q5",
    topic: "Client Risk Profiles & Objectives",
    question: 'A client says they want "high growth but no risk." The best response is:',
    options: [
      "Recommend a balanced fund as a compromise",
      "Explain that all investments carry some risk and decline the mandate",
      "Explore what risk means to them and align expectations with realistic outcomes",
      "Place them in the highest-risk category since they want growth",
    ],
    correctIndex: 2,
  },
  {
    id: "q6",
    topic: "Client Risk Profiles & Objectives",
    question: "How often should a client's risk profile be formally reviewed?",
    options: [
      "Only when the client requests it",
      "Every five years as standard practice",
      "At each scheduled review or after a significant life event",
      "Annually on a fixed calendar date",
    ],
    correctIndex: 2,
  },
  // Portfolio Alignment & Suitability (Q7-10)
  {
    id: "q7",
    topic: "Portfolio Alignment & Suitability",
    question: "Under suitability rules, a portfolio recommendation must demonstrate:",
    options: [
      "That the portfolio will outperform the market over 3 years",
      "Alignment between the client's objectives, risk capacity, and the recommended investments",
      "That fees are the lowest available in the market",
      "That at least 60% of assets are in equities",
    ],
    correctIndex: 1,
  },
  {
    id: "q8",
    topic: "Portfolio Alignment & Suitability",
    question: "What is the primary purpose of a suitability framework?",
    options: [
      "To standardise all client portfolios for operational efficiency",
      "To ensure every portfolio decision can be justified against the client's mandate",
      "To limit the firm's liability in case of market downturns",
      "To maximise portfolio returns within a given time horizon",
    ],
    correctIndex: 1,
  },
  {
    id: "q9",
    topic: "Portfolio Alignment & Suitability",
    question: "If a client requests an investment outside their agreed mandate, you should:",
    options: [
      "Decline the request and explain it is not permitted",
      "Execute the trade immediately to satisfy the client",
      "Document the request, discuss the implications, and obtain informed consent before proceeding",
      "Refer the client to another adviser who handles that asset class",
    ],
    correctIndex: 2,
  },
  {
    id: "q10",
    topic: "Portfolio Alignment & Suitability",
    question: "Which document serves as the primary reference for a client's investment mandate?",
    options: [
      "The firm's standard terms and conditions",
      "The most recent portfolio valuation statement",
      "The investment management agreement and latest suitability report",
      "The client's original application form",
    ],
    correctIndex: 2,
  },
];

const TOPICS = [
  "Investment Proposition & Client Outcomes",
  "Client Risk Profiles & Objectives",
  "Portfolio Alignment & Suitability",
];

interface InlineAssessmentProps {
  onComplete: (score: number, answers: number[]) => void;
}

export function InlineAssessment({ onComplete }: InlineAssessmentProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUESTIONS.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ + (confirmed ? 1 : 0)) / QUESTIONS.length) * 100;

  const handleSelect = (idx: number) => {
    if (confirmed) return;
    setSelectedOption(idx);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = selectedOption;
    setAnswers(newAnswers);
    setConfirmed(true);
  };

  const handleNext = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      setConfirmed(false);
    } else {
      // Calculate score
      const correct = answers.reduce<number>((acc, a, i) => acc + (a === QUESTIONS[i].correctIndex ? 1 : 0), 0);
      // Count the last answer too
      const finalAnswers = [...answers];
      finalAnswers[currentQ] = selectedOption;
      const finalCorrect = finalAnswers.reduce<number>((acc, a, i) => acc + (a === QUESTIONS[i].correctIndex ? 1 : 0), 0);
      const score = Math.round((finalCorrect / QUESTIONS.length) * 100);
      setShowResult(true);
      onComplete(score, finalAnswers as number[]);
    }
  };

  const handleRetest = () => {
    setCurrentQ(0);
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setSelectedOption(null);
    setConfirmed(false);
    setShowResult(false);
  };

  if (showResult) {
    const finalAnswers = answers;
    const correct = finalAnswers.reduce<number>((acc, a, i) => acc + (a === QUESTIONS[i].correctIndex ? 1 : 0), 0);
    const score = Math.round((correct / QUESTIONS.length) * 100);
    const passed = score >= 80;

    // Per-topic breakdown
    const topicScores = TOPICS.map((topic) => {
      const qs = QUESTIONS.filter((q) => q.topic === topic);
      const topicCorrect = qs.reduce((acc, q) => {
        const idx = QUESTIONS.indexOf(q);
        return acc + (finalAnswers[idx] === q.correctIndex ? 1 : 0);
      }, 0);
      return { topic, correct: topicCorrect, total: qs.length };
    });

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[85%] ml-10">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          {/* Score header */}
          <div className={cn("px-5 py-4", passed ? "bg-green-500/10" : "bg-amber-500/10")}>
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <p className="text-lg font-bold text-foreground">{score}%</p>
                <p className="text-xs text-muted-foreground">
                  {correct} of {QUESTIONS.length} correct
                </p>
              </div>
            </div>
          </div>

          {/* Topic breakdown */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topic Breakdown</p>
            {topicScores.map((ts) => (
              <div key={ts.topic} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{ts.topic}</span>
                <span className={cn("font-medium", ts.correct === ts.total ? "text-green-600" : ts.correct >= ts.total / 2 ? "text-foreground" : "text-amber-600")}>
                  {ts.correct}/{ts.total}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-border/50 flex items-center gap-3">
            <Link
              to="/skill-target/RAT-ST-001"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all"
            >
              View Your Skill Target
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Button variant="ghost" size="sm" onClick={handleRetest} className="text-muted-foreground gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Retest
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-[85%] ml-10">
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {/* Progress bar */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-wider">{question.topic}</span>
            <span className="text-xs text-muted-foreground">
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Question */}
        <div className="px-5 py-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">{question.question}</p>
        </div>

        {/* Options */}
        <div className="px-5 pb-3 space-y-2">
          <AnimatePresence mode="wait">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;
              const showFeedback = confirmed;

              return (
                <motion.button
                  key={`${question.id}-${idx}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelect(idx)}
                  disabled={confirmed}
                  className={cn(
                    "w-full text-left rounded-xl px-4 py-3 text-sm border transition-all",
                    !showFeedback && !isSelected && "border-border/50 hover:border-primary/30 hover:bg-primary/5",
                    !showFeedback && isSelected && "border-primary bg-primary/10 ring-1 ring-primary/20",
                    showFeedback && isCorrect && "border-green-500/50 bg-green-500/10 text-foreground",
                    showFeedback && isSelected && !isCorrect && "border-red-500/50 bg-red-500/10 text-foreground",
                    showFeedback && !isSelected && !isCorrect && "border-border/30 opacity-50",
                    confirmed && "cursor-default"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      "shrink-0 h-5 w-5 rounded-full border text-[0.7rem] font-medium flex items-center justify-center mt-0.5",
                      !showFeedback && isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground",
                      showFeedback && isCorrect && "border-green-600 bg-green-600 text-white",
                      showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-500 text-white"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={cn("leading-snug", isCorrect && "font-medium")}>{opt}</span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Action */}
        <div className="px-5 pb-4 flex justify-end">
          {!confirmed ? (
            <Button size="sm" onClick={handleConfirm} disabled={selectedOption === null} className="rounded-xl gap-1">
              Confirm
            </Button>
          ) : (
            <Button size="sm" onClick={handleNext} className="rounded-xl gap-1">
              {currentQ < QUESTIONS.length - 1 ? "Next" : "See Results"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
