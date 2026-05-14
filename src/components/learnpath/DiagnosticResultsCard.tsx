import { CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, BookOpen, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChapterEntry {
  code: string;
  title: string;
  minutes?: number;
}

interface Props {
  moduleTitle: string;
  total: number;
  correct: number;
  /** All real chapters of this module (in order). */
  chapters: ChapterEntry[];
  /** Subset of chapter codes that got reopened (learner answered wrong). */
  reopenedCodes: Set<string>;
  nextTitle?: string | null;
  onRetry: () => void;
  onContinue: () => void;
}

/**
 * Post-submission results screen for the synthetic Quick Diagnostic.
 * Mirrors the visual language of LearnPathAssessment's result panel but is
 * chapter-scoped, since each diagnostic question maps to a chapter.
 */
export function DiagnosticResultsCard({
  moduleTitle,
  total,
  correct,
  chapters,
  reopenedCodes,
  nextTitle,
  onRetry,
  onContinue,
}: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const allCorrect = correct === total && total > 0;
  const reopened = chapters.filter((c) => reopenedCodes.has(c.code));
  const mastered = chapters.filter((c) => !reopenedCodes.has(c.code));

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 px-2.5 py-0.5 text-xs font-medium">
            Quick Diagnostic
          </span>
          <span className="text-xs text-muted-foreground">Result</span>
        </div>
        <h1 className="font-display text-lg font-bold text-foreground">{moduleTitle}</h1>
      </div>

      {/* Score panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl bg-card border border-border p-8 shadow-card text-center"
      >
        <div
          className={cn(
            "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            allCorrect ? "bg-success/15" : "bg-amber-500/15",
          )}
        >
          {allCorrect ? (
            <CheckCircle2 className="h-8 w-8 text-success" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          )}
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground mb-1">
          {correct}<span className="text-muted-foreground text-2xl">/{total}</span>
        </h2>
        <p
          className={cn(
            "text-sm font-medium mb-1",
            allCorrect ? "text-success" : "text-amber-700 dark:text-amber-400",
          )}
        >
          {allCorrect ? "All correct — module skipped" : `${pct}% — some chapters reopened`}
        </p>
        <p className="text-xs text-muted-foreground">
          {allCorrect
            ? "You demonstrated mastery across all chapters in this module."
            : `${mastered.length} chapter${mastered.length === 1 ? "" : "s"} skipped · ${reopened.length} to revisit.`}
        </p>
      </motion.div>

      {/* Chapter breakdown */}
      {reopened.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Chapters to revisit</h3>
          </div>
          <ul className="space-y-1.5">
            {reopened.map((c, i) => (
              <li
                key={c.code}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <span className="text-xs font-mono text-muted-foreground w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{c.title}</span>
                {c.minutes ? (
                  <span className="text-xs text-muted-foreground">{c.minutes} min</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mastered.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <SkipForward className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Skipped {mastered.length === 1 ? "chapter" : "chapters"}
            </h3>
          </div>
          <ul className="space-y-1.5">
            {mastered.map((c) => (
              <li
                key={c.code}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span className="flex-1 truncate">{c.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Retake diagnostic
        </Button>
        <Button onClick={onContinue} size="sm" className="gap-2">
          {nextTitle ? "Continue" : "Back to module"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {nextTitle && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Next up</p>
          <p className="text-sm font-medium text-foreground">{nextTitle}</p>
        </div>
      )}
    </div>
  );
}
