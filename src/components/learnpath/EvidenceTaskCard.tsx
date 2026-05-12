import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, ShieldAlert, FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEvidenceTask } from "@/hooks/useEvidenceTask";
import { useCatalogChaptersForModule } from "@/hooks/useCatalogChaptersForModule";
import { useContentSubstitution } from "@/lib/contentSubstitution";

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

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Mark every chapter in this module as completed (they are all "covered by evidence")
      // and stash the submission on the first chapter's metadata.
      const chapterCodes = chapters.length > 0 ? chapters.map((c) => c.chapterCode) : [moduleCode];
      const submission = {
        text: draft.trim(),
        word_count: wordCount,
        format: task.submissionFormat,
        evidence_task_code: task.evidenceTaskCode,
        submitted_at: new Date().toISOString(),
      };

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
        const meta = (i === 0 ? { ...baseMeta, evidence_submission: submission } : baseMeta) as any;
        if (existing?.id) {
          await supabase
            .from("learner_progress")
            .update({ status: "completed", completed_at: now, started_at: existing.started_at ?? now, metadata: meta })
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
      setSubmitted(true);
      onPersisted?.();
    } catch (e: any) {
      console.error("[EvidenceTaskCard] submit failed", e);
      setError(e?.message ?? "Could not save your evidence. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6 space-y-4"
      >
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Evidence submitted</h2>
          <p className="text-sm text-muted-foreground">
            We've sent your submission for review. {REVIEWER_LABEL[task.reviewerRole] ?? "It will be reviewed shortly."}
          </p>
          {nextChapter ? (
            <Button onClick={onContinue} className="gap-2 mx-auto">
              Continue to next chapter <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onContinue} variant="outline" className="gap-2 mx-auto">
              Back to all chapters <ArrowRight className="h-4 w-4" />
            </Button>
          )}
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
          {task.synthesized && (
            <Badge variant="outline" className="text-[0.65rem] text-muted-foreground">
              Generic brief — no evidence template configured for this module
            </Badge>
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
