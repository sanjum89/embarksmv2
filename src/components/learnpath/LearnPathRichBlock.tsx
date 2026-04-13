import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Trophy, ChevronRight, BookOpen, Circle, CircleCheck, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Inline Quiz ── */

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface InlineQuizData {
  title?: string;
  questions: QuizQuestion[];
}

function InlineQuiz({ data }: { data: InlineQuizData }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const q = data.questions[currentQ];
  const isCorrect = selected === q?.correctIndex;

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    setResults((prev) => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (currentQ + 1 >= data.questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((i) => i + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  if (finished) {
    const correct = results.filter(Boolean).length;
    const total = data.questions.length;
    const pct = Math.round((correct / total) * 100);
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-chart-4" />
          Quiz Complete!
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                className={cn("transition-all duration-700", pct >= 60 ? "stroke-chart-2" : "stroke-destructive")}
                strokeWidth="3"
                strokeDasharray={`${pct * 0.94} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
              {pct}%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{correct}/{total} correct</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pct >= 80 ? "Great job! You've got a solid grasp 🎉" : pct >= 60 ? "Good effort — review a couple of areas 💪" : "Worth revisiting this chapter 📖"}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          {data.questions.map((question, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {results[i] ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              )}
              <span className="text-muted-foreground truncate">{question.question}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!q) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{data.title || "Quick Quiz"}</span>
        <span className="text-[10px] text-muted-foreground">{currentQ + 1}/{data.questions.length}</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((currentQ + (confirmed ? 1 : 0)) / data.questions.length) * 100}%` }} />
      </div>
      <p className="text-sm text-foreground font-medium">{q.question}</p>
      <div className="space-y-1.5">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const showCorrect = confirmed && i === q.correctIndex;
          const showWrong = confirmed && isSelected && !isCorrect;
          return (
            <button
              key={i}
              onClick={() => !confirmed && setSelected(i)}
              disabled={confirmed}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2 text-xs transition-all border",
                !confirmed && isSelected && "border-primary bg-primary/10 text-foreground",
                !confirmed && !isSelected && "border-border bg-background hover:bg-muted/50 text-foreground/80",
                showCorrect && "border-chart-2 bg-chart-2/10 text-foreground",
                showWrong && "border-destructive bg-destructive/10 text-foreground",
                confirmed && !showCorrect && !showWrong && "opacity-50"
              )}
            >
              <span className="font-medium mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {confirmed && q.explanation && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            {isCorrect ? "✅ " : "💡 "}{q.explanation}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="flex justify-end">
        {!confirmed ? (
          <Button size="sm" onClick={handleConfirm} disabled={selected === null} className="text-xs h-7 px-3">
            Confirm
          </Button>
        ) : (
          <Button size="sm" onClick={handleNext} className="text-xs h-7 px-3">
            {currentQ + 1 >= data.questions.length ? "See Results" : "Next"} <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Skill Gaps Chart ── */

interface SkillGapItem {
  name: string;
  current: number;
  required: number;
  currentLevel?: string;
  requiredLevel?: string;
  gap?: string;
}

interface SkillGapsChartData {
  title?: string;
  skills: SkillGapItem[];
}

const GAP_COLORS: Record<string, string> = {
  High: "bg-destructive",
  Medium: "bg-chart-4",
  Low: "bg-chart-2",
  "No gap": "bg-chart-2",
};

function SkillGapsChart({ data }: { data: SkillGapsChartData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        {data.title || "Skill Gaps"}
      </div>
      <div className="space-y-2.5">
        {data.skills.map((skill) => {
          const gapKey = (skill.gap ?? "").replace(/ gap/i, "");
          const barColor = GAP_COLORS[gapKey] || "bg-primary";
          return (
            <div key={skill.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground truncate max-w-[55%]">{skill.name}</span>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{skill.currentLevel || `${skill.current}%`}</span>
                  <span>→</span>
                  <span className="font-medium text-foreground">{skill.requiredLevel || `${skill.required}%`}</span>
                </div>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(skill.current, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn("h-full rounded-full", barColor)}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/60"
                  style={{ left: `${Math.min(skill.required, 100)}%` }}
                  title={`Required: ${skill.requiredLevel || skill.required}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-foreground/60 inline-block" /> Required</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Current</span>
      </div>
    </div>
  );
}

/* ── Learning Path Visual ── */

interface LearningPathModule {
  title: string;
  status: string;
  skillTarget?: string;
}

interface LearningPathVisualData {
  modules: LearningPathModule[];
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CircleCheck className="h-4 w-4 text-chart-2" />,
  in_progress: <CircleDot className="h-4 w-4 text-primary" />,
  available: <Circle className="h-4 w-4 text-muted-foreground" />,
  locked: <Circle className="h-4 w-4 text-muted-foreground/40" />,
};

function LearningPathVisual({ data }: { data: LearningPathVisualData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        Your Learning Path
      </div>
      <div className="relative pl-4">
        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
        {data.modules.map((mod, i) => (
          <div key={i} className="relative flex items-start gap-3 py-1.5">
            <div className="relative z-10 bg-card">
              {STATUS_ICONS[mod.status] || STATUS_ICONS.available}
            </div>
            <div className="min-w-0">
              <p className={cn("text-xs font-medium truncate", mod.status === "locked" ? "text-muted-foreground/50" : "text-foreground")}>
                {mod.title}
              </p>
              {mod.skillTarget && (
                <p className="text-[10px] text-muted-foreground">{mod.skillTarget}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main renderer ── */

export type RichBlockType = "inline_quiz" | "skill_gaps_chart" | "learning_path_visual";

export interface EmbarkRichBlockData {
  type: RichBlockType;
  data: any;
}

const RENDERERS: Record<string, React.FC<{ data: any }>> = {
  inline_quiz: InlineQuiz,
  skill_gaps_chart: SkillGapsChart,
  learning_path_visual: LearningPathVisual,
};

export function EmbarkRichBlock({ block }: { block: EmbarkRichBlockData }) {
  const Renderer = RENDERERS[block.type];
  if (!Renderer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-3 my-2"
    >
      <Renderer data={block.data} />
    </motion.div>
  );
}

/* ── Parser ── */

export function parseEmbarkRichBlocks(text: string): { segments: Array<{ type: "text"; content: string } | { type: "block"; block: EmbarkRichBlockData }>; } {
  const regex = /:::RICH_BLOCK(\{[\s\S]*?\}):::/g;
  const segments: Array<{ type: "text"; content: string } | { type: "block"; block: EmbarkRichBlockData }> = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type && RENDERERS[parsed.type]) {
        segments.push({ type: "block", block: parsed });
      } else {
        segments.push({ type: "text", content: match[0] });
      }
    } catch {
      segments.push({ type: "text", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: "text", content: text });
  }

  return { segments };
}
