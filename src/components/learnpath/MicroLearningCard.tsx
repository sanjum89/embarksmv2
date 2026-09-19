import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Zap, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { useContentSubstitution } from "@/lib/contentSubstitution";

interface Props {
  microLearningId: string;
  onCompleted?: () => void;
  onContinue?: () => void;
}

interface MicroRow {
  id: string;
  kind: string;
  status: string;
  topic_tag: string | null;
  failed_question: string | null;
  learner_answer: string | null;
  correct_answer: string | null;
  why_wrong: string | null;
  teaching_content_outline: string | null;
  practical_activity: string | null;
}

/**
 * Renders one per-learner remediation item — a micro-learning (created after a
 * failed check) or a gap module (created after a pass that still had gaps).
 */
export function MicroLearningCard({ microLearningId, onCompleted, onContinue }: Props) {
  const { substitute } = useContentSubstitution();
  const [row, setRow] = useState<MicroRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("micro_learnings")
      .select(
        "id, kind, status, topic_tag, failed_question, learner_answer, correct_answer, why_wrong, teaching_content_outline, practical_activity",
      )
      .eq("id", microLearningId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setRow((data as any) ?? null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [microLearningId]);

  const markComplete = async () => {
    setSaving(true);
    try {
      await supabase
        .from("micro_learnings")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", microLearningId);
      setRow((r) => (r ? { ...r, status: "completed" } : r));
      onCompleted?.();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!row) {
    return <div className="p-8 text-sm text-muted-foreground">This item is no longer available.</div>;
  }

  const isGap = row.kind === "gap_module";
  const topic = row.topic_tag?.trim() || "key topic";
  const done = row.status === "completed";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <div className="space-y-2">
        <Badge
          variant="outline"
          className={
            isGap
              ? "gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "gap-1 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
          }
        >
          {isGap ? <Target className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          {isGap ? "Gap module" : "Micro-learning"}
        </Badge>
        <h1 className="text-2xl font-semibold text-foreground">{substitute(topic)}</h1>
        <p className="text-sm text-muted-foreground">
          {isGap
            ? "You passed — this short module closes the remaining gap on this topic."
            : "Built for you from the question you missed in your last check."}
        </p>
      </div>

      {row.failed_question && (
        <Card className="p-4 space-y-2 bg-muted/40">
          <p className="text-sm font-medium text-foreground">{substitute(row.failed_question)}</p>
          {row.learner_answer && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Your answer: </span>
              {substitute(row.learner_answer)}
            </p>
          )}
          {row.correct_answer && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              <span className="font-medium">Correct answer: </span>
              {substitute(row.correct_answer)}
            </p>
          )}
          {row.why_wrong && (
            <p className="text-xs text-muted-foreground">{substitute(row.why_wrong)}</p>
          )}
        </Card>
      )}

      {row.teaching_content_outline && (
        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {substitute(row.teaching_content_outline)}
        </div>
      )}

      {row.practical_activity && (
        <Card className="p-4 space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Try this</div>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {substitute(row.practical_activity)}
          </p>
        </Card>
      )}

      <div className="flex items-center gap-2 pt-2">
        {done ? (
          <>
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </span>
            {onContinue && (
              <Button size="sm" variant="outline" className="gap-1" onClick={onContinue}>
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </>
        ) : (
          <Button size="sm" onClick={markComplete} disabled={saving} className="gap-1">
            {saving ? "Saving…" : "Mark as complete"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
