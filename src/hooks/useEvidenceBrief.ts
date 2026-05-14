import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EvidenceBriefSection {
  heading: string;
  bullets?: string[];
  body?: string;
}

export interface EvidenceBrief {
  scenarioTitle: string;
  contextParagraph: string;
  sections: EvidenceBriefSection[];
  keyFigures?: { label: string; value: string }[];
  promptToLearner?: string;
}

interface Args {
  accountId: string;
  employeeId: string;
  cohortId: string;
  moduleCode: string;
  moduleTitle: string;
  evidenceTitle: string;
  evidenceDescription?: string | null;
  qualityIndicators?: string[];
  submissionFormat?: string;
  firstChapterCode: string | null;
  accountName?: string;
}

interface State {
  brief: EvidenceBrief | null;
  isLoading: boolean;
  error: string | null;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-evidence-brief`;

export function useEvidenceBrief(args: Args | null) {
  const [state, setState] = useState<State>({ brief: null, isLoading: false, error: null });

  const callAi = useCallback(async (a: Args): Promise<EvidenceBrief | null> => {
    const resp = await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        moduleCode: a.moduleCode,
        moduleTitle: a.moduleTitle,
        evidenceTitle: a.evidenceTitle,
        evidenceDescription: a.evidenceDescription,
        qualityIndicators: a.qualityIndicators,
        submissionFormat: a.submissionFormat,
        accountName: a.accountName,
      }),
    });
    if (!resp.ok) throw new Error(`Brief gen failed (${resp.status})`);
    const j = await resp.json();
    return (j?.brief ?? null) as EvidenceBrief | null;
  }, []);

  const persist = useCallback(async (a: Args, brief: EvidenceBrief) => {
    if (!a.firstChapterCode) return;
    const { data: existing } = await supabase
      .from("learner_progress")
      .select("id, metadata, started_at, status")
      .eq("account_id", a.accountId)
      .eq("employee_id", a.employeeId)
      .eq("cohort_id", a.cohortId)
      .eq("module_code", a.moduleCode)
      .eq("chapter_code", a.firstChapterCode)
      .maybeSingle();
    const meta = { ...(existing?.metadata as Record<string, unknown> | null ?? {}), evidence_brief: brief };
    if (existing?.id) {
      await supabase.from("learner_progress").update({ metadata: meta }).eq("id", existing.id);
    } else {
      await supabase.from("learner_progress").insert([{
        account_id: a.accountId,
        employee_id: a.employeeId,
        cohort_id: a.cohortId,
        module_code: a.moduleCode,
        chapter_code: a.firstChapterCode,
        status: "not_started",
        metadata: meta,
      }]);
    }
  }, []);

  const load = useCallback(async (a: Args, forceRegenerate = false) => {
    setState({ brief: null, isLoading: true, error: null });
    try {
      // Look for cached brief
      if (!forceRegenerate && a.firstChapterCode) {
        const { data } = await supabase
          .from("learner_progress")
          .select("metadata")
          .eq("account_id", a.accountId)
          .eq("employee_id", a.employeeId)
          .eq("cohort_id", a.cohortId)
          .eq("module_code", a.moduleCode)
          .eq("chapter_code", a.firstChapterCode)
          .maybeSingle();
        const cached = (data?.metadata as any)?.evidence_brief as EvidenceBrief | undefined;
        if (cached && cached.scenarioTitle) {
          setState({ brief: cached, isLoading: false, error: null });
          return;
        }
      }
      const brief = await callAi(a);
      if (brief) await persist(a, brief);
      setState({ brief, isLoading: false, error: null });
    } catch (e: any) {
      setState({ brief: null, isLoading: false, error: e?.message ?? "Failed" });
    }
  }, [callAi, persist]);

  useEffect(() => {
    if (!args) {
      setState({ brief: null, isLoading: false, error: null });
      return;
    }
    void load(args);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args?.accountId, args?.employeeId, args?.cohortId, args?.moduleCode, args?.firstChapterCode]);

  const regenerate = useCallback(() => {
    if (args) void load(args, true);
  }, [args, load]);

  return { ...state, regenerate };
}
