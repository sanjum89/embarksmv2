import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EvidenceTask {
  evidenceTaskCode: string;
  moduleCode: string;
  evidenceTitle: string;
  evidenceDescription: string | null;
  exampleSummary: string | null;
  qualityIndicators: string[];
  submissionFormat: string;
  reviewerRole: string;
  requiredForGate: boolean;
  /** True when synthesized from chapter fields (no DB row existed). */
  synthesized: boolean;
}

interface State {
  task: EvidenceTask | null;
  isLoading: boolean;
}

/** Fetch a module's evidence task (1 row per module). Falls back to a synthesized brief. */
export function useEvidenceTask(
  accountId: string | null | undefined,
  moduleCode: string | null | undefined,
  fallback?: { moduleTitle?: string; learningObjective?: string | null; practicalActivity?: string | null },
): State {
  const [state, setState] = useState<State>({ task: null, isLoading: false });

  useEffect(() => {
    if (!accountId || !moduleCode) {
      setState({ task: null, isLoading: false });
      return;
    }
    let cancelled = false;
    setState({ task: null, isLoading: true });

    (async () => {
      const { data } = await supabase
        .from("catalog_evidence_tasks")
        .select(
          "evidence_task_code, module_code, evidence_title, evidence_description, example_synthetic_evidence_summary, quality_indicators, submission_format, reviewer_role, required_for_gate",
        )
        .eq("account_id", accountId)
        .eq("module_code", moduleCode)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setState({
          task: {
            evidenceTaskCode: (data as any).evidence_task_code,
            moduleCode: (data as any).module_code,
            evidenceTitle: (data as any).evidence_title,
            evidenceDescription: (data as any).evidence_description ?? null,
            exampleSummary: (data as any).example_synthetic_evidence_summary ?? null,
            qualityIndicators: Array.isArray((data as any).quality_indicators)
              ? (data as any).quality_indicators
              : [],
            submissionFormat: (data as any).submission_format ?? "written",
            reviewerRole: (data as any).reviewer_role ?? "manager",
            requiredForGate: !!(data as any).required_for_gate,
            synthesized: false,
          },
          isLoading: false,
        });
        return;
      }

      // Synthesize from fallback so the UI never shows blank.
      const title = fallback?.moduleTitle ?? "Evidence task";
      const desc =
        fallback?.practicalActivity?.trim() ||
        `Write a 200–400 word note describing how you would apply the ideas in "${title}" to a real Rathbones client situation. Reference a specific scenario you have seen or could plausibly encounter.`;
      const indicators = [
        fallback?.learningObjective?.trim() || "Demonstrates clear understanding of the module's key concept.",
        "Grounds the answer in a specific Rathbones client or scenario.",
        "Identifies the practical decision, action or recommendation made.",
        "Calls out the risk, regulatory or suitability consideration.",
        "Reflects on what you would do differently next time.",
      ];
      setState({
        task: {
          evidenceTaskCode: `synthetic_${moduleCode}`,
          moduleCode,
          evidenceTitle: `Evidence — ${title}`,
          evidenceDescription: desc,
          exampleSummary: null,
          qualityIndicators: indicators,
          submissionFormat: "written",
          reviewerRole: "manager",
          requiredForGate: false,
          synthesized: true,
        },
        isLoading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, moduleCode, fallback?.moduleTitle, fallback?.learningObjective, fallback?.practicalActivity]);

  return state;
}
