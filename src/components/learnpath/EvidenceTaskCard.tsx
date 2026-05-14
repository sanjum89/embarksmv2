import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  FileText,
  Sparkles,
  Loader2,
  RefreshCcw,
  Clipboard,
  UserCheck,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEvidenceTask } from "@/hooks/useEvidenceTask";
import { useCatalogChaptersForModule } from "@/hooks/useCatalogChaptersForModule";
import { useEvidenceBrief } from "@/hooks/useEvidenceBrief";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { useAccount } from "@/contexts/AccountContext";
import {
  generateEvidenceAssessment,
  applyEvidenceOutcome,
  type EvidenceAssessment,
} from "@/lib/evidenceAssessment";

interface Props {
  accountId: string;
  employeeId: string;
  cohortId: string;
  moduleCode: string;
  moduleTitle: string;
  reason?: string | null;
  nextChapter?: { id: string; title: string } | null;
  onContinue: () => void;
  onPersisted?: () => void;
}

const FORMAT_LABEL: Record<string, string> = {
  written: "Written submission",
  upload: "File upload",
  observation: "Manager observation",
  recording: "Recording",
  system_record: "System record",
};

const REVIEWER_LABEL: Record<string, string> = {
  manager: "Reviewed by your line manager",
  mentor: "Reviewed by your mentor",
  assessor: "Reviewed by an assessor",
};

export function EvidenceTaskCard({
  accountId,
  employeeId,
  cohortId,
  moduleCode,
  moduleTitle,
  reason,
  nextChapter,
  onContinue,
  onPersisted,
}: Props) {
  const { substitute } = useContentSubstitution();
  const { normalizedAccount } = useAccount();
  const { chapters } = useCatalogChaptersForModule(accountId, moduleCode);
  const fallback = useMemo(
    () => ({
      moduleTitle,
      learningObjective: chapters[0]?.learningObjective ?? null,
      practicalActivity: chapters[0]?.practicalActivity ?? null,
    }),
    [chapters, moduleTitle],
  );
  const { task, isLoading } = useEvidenceTask(accountId, moduleCode, fallback);

  // Generate the actual scenario / data pack the learner has to work on
  const briefArgs = useMemo(() => {
    if (!task) return null;
    return {
      accountId,
      employeeId,
      cohortId,
      moduleCode,
      moduleTitle,
      evidenceTitle: task.evidenceTitle,
      evidenceDescription: task.evidenceDescription ?? undefined,
      qualityIndicators: task.qualityIndicators,
      submissionFormat: task.submissionFormat,
      firstChapterCode: chapters[0]?.chapterCode ?? null,
      accountName: normalizedAccount?.branding?.name,
    };
  }, [accountId, employeeId, cohortId, moduleCode, moduleTitle, task, chapters, normalizedAccount?.branding?.name]);
  const { brief, isLoading: briefLoading, regenerate } = useEvidenceBrief(briefArgs);

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<EvidenceAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= 50 && !submitting;

  if (isLoading || !task) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading evidence task…
      </div>
    );
  }

  const handleRegenerate = () => {
    if (draft.trim().length > 0) {
      const ok = window.confirm("Regenerating will replace the current scenario. Your draft is kept. Continue?");
      if (!ok) return;
    }
    regenerate();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const chapterCodes = chapters.length > 0 ? chapters.map((c) => c.chapterCode) : [moduleCode];
      const submission = {
        text: draft.trim(),
        word_count: wordCount,
        format: task.submissionFormat,
        evidence_task_code: task.evidenceTaskCode,
        submitted_at: new Date().toISOString(),
      };

      // Generate the simulated assessment
      const base = generateEvidenceAssessment(task.qualityIndicators);
      // Apply structural outcome (skip / reopen) — non-blocking visually
      const applied = await applyEvidenceOutcome({
        accountId,
        employeeId,
        cohortId,
        moduleCode,
        outcome: base.outcome,
      });
      const finalAssessment: EvidenceAssessment = { ...base, ...applied };

      // Persist the chapter completions + submission + assessment
      for (const [i, chapterCode] of chapterCodes.entries()) {
        const { data: existing } = await supabase
          .from("learner_progress")
          .select("id, started_at, metadata")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("cohort_id", cohortId)
          .eq("module_code", moduleCode)
          .eq("chapter_code", chapterCode)
          .maybeSingle();
        const now = new Date().toISOString();
        const baseMeta = (existing?.metadata as Record<string, unknown> | null) ?? {};
        const meta: any =
          i === 0
            ? { ...baseMeta, evidence_submission: submission, evidence_assessment: finalAssessment }
            : baseMeta;
        if (existing?.id) {
          await supabase
            .from("learner_progress")
            .update({
              status: "completed",
              completed_at: now,
              started_at: existing.started_at ?? now,
              metadata: meta,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("learner_progress").insert([{
            account_id: accountId,
            employee_id: employeeId,
            cohort_id: cohortId,
            module_code: moduleCode,
            chapter_code: chapterCode,
            status: "completed",
            started_at: now,
            completed_at: now,
            metadata: meta,
          }]);
        }
      }
      setAssessment(finalAssessment);
      onPersisted?.();
    } catch (e: any) {
      console.error("[EvidenceTaskCard] submit failed", e);
      setError(e?.message ?? "Could not save your evidence. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (assessment) {
    const scoreColour =
      assessment.score >= 85
        ? "text-emerald-600 dark:text-emerald-400"
        : assessment.score >= 70
          ? "text-amber-600 dark:text-amber-400"
          : "text-rose-600 dark:text-rose-400";
    const ringColour =
      assessment.score >= 85
        ? "border-emerald-500/40 bg-emerald-500/10"
        : assessment.score >= 70
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-rose-500/40 bg-rose-500/10";
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6 space-y-5"
      >
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <Badge variant="outline" className="text-[0.65rem]">
              Assessed by Manager (simulated)
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(assessment.assessedAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div
              className={`shrink-0 h-20 w-20 rounded-full border-4 ${ringColour} flex items-center justify-center`}
            >
              <span className={`text-2xl font-display font-bold ${scoreColour}`}>{assessment.score}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-display font-bold text-foreground">
                Evidence accepted
              </h2>
              <p className="text-sm text-muted-foreground">
                Score {assessment.score} / 100 against the suitability criteria.
              </p>
            </div>
          </div>

          <ul className="space-y-1.5">
            {assessment.feedback.map((f, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {assessment.outcome === "skip_remaining" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
              <SkipForward className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">You can skip the remaining modules in this track.</p>
                <p className="text-muted-foreground mt-0.5">
                  Your evidence demonstrates current competence — we've marked the rest of this track as covered.
                </p>
              </div>
            </div>
          )}
          {assessment.outcome === "reopen_for_refresh" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">
                  Refresher added{assessment.refresherModuleTitle ? `: ${assessment.refresherModuleTitle}` : ""}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Your manager wants you to revisit one earlier topic to bed it in before moving on.
                </p>
              </div>
            </div>
          )}
          {assessment.outcome === "pass_continue" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Pass — continue with the next chapter.</p>
                <p className="text-muted-foreground mt-0.5">No structural changes to your plan.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button onClick={onContinue} className="gap-2">
              {nextChapter ? "Continue to next chapter" : "Back to all chapters"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20">
            Evidence required
          </Badge>
          {task.requiredForGate && (
            <Badge variant="outline" className="text-[0.65rem]">Required for readiness gate</Badge>
          )}
        </div>
        <h1 className="text-xl font-display font-bold text-foreground">{substitute(task.evidenceTitle)}</h1>
        {reason && <p className="text-sm text-muted-foreground">{substitute(reason)}</p>}
      </div>

      {/* Why this matters */}
      {fallback.learningObjective && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this matters</h3>
          <p className="text-sm text-foreground">{substitute(fallback.learningObjective)}</p>
        </section>
      )}

      {/* What to submit */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> What to submit
        </h3>
        <p className="text-sm text-foreground whitespace-pre-line">
          {substitute(task.evidenceDescription ?? "")}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className="text-[0.65rem]">
            {FORMAT_LABEL[task.submissionFormat] ?? task.submissionFormat}
          </Badge>
          <Badge variant="outline" className="text-[0.65rem]">
            {REVIEWER_LABEL[task.reviewerRole] ?? task.reviewerRole}
          </Badge>
        </div>
      </section>

      {/* YOUR TASK — generated brief */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Clipboard className="h-3.5 w-3.5" /> Your task
          </h3>
          {brief && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-7 px-2 text-xs gap-1"
              disabled={briefLoading}
            >
              <RefreshCcw className={`h-3 w-3 ${briefLoading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          )}
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          {briefLoading || !brief ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating your scenario…
            </div>
          ) : (
            <>
              <div>
                <h4 className="font-display text-base font-bold text-foreground">
                  {substitute(brief.scenarioTitle)}
                </h4>
                <p className="text-sm text-foreground mt-1.5 leading-relaxed">
                  {substitute(brief.contextParagraph)}
                </p>
              </div>

              {brief.keyFigures && brief.keyFigures.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {brief.keyFigures.map((kf, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-card border border-border px-3 py-2"
                    >
                      <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                        {substitute(kf.label)}
                      </div>
                      <div className="text-sm font-medium text-foreground">{substitute(kf.value)}</div>
                    </div>
                  ))}
                </div>
              )}

              {brief.sections?.map((sec, i) => (
                <div key={i} className="space-y-1.5">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {substitute(sec.heading)}
                  </h5>
                  {sec.bullets && sec.bullets.length > 0 ? (
                    <ul className="space-y-1">
                      {sec.bullets.map((b, j) => (
                        <li key={j} className="text-sm text-foreground flex gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{substitute(b)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {substitute(sec.body ?? "")}
                    </p>
                  )}
                </div>
              ))}

              {brief.promptToLearner && (
                <div className="text-sm font-medium text-foreground border-t border-border pt-3">
                  {substitute(brief.promptToLearner)}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* What good looks like */}
      {task.qualityIndicators.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> What good looks like
          </h3>
          <ul className="space-y-1">
            {task.qualityIndicators.map((qi, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{substitute(qi)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Worked example */}
      {task.exampleSummary && (
        <details className="rounded-xl border border-border bg-muted/30 p-3">
          <summary className="text-sm font-medium text-foreground cursor-pointer">
            Show a worked example
          </summary>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
            {substitute(task.exampleSummary)}
          </p>
        </details>
      )}

      {/* Submission */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your evidence</h3>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write 200–400 words describing your evidence. Be specific about the client, decision, and what you would do."
          rows={10}
          className="text-sm"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{wordCount} words {wordCount > 0 && wordCount < 50 ? "(50+ to submit)" : ""}</span>
          {error && <span className="text-destructive">{error}</span>}
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit evidence
        </Button>
      </section>
    </div>
  );
}
