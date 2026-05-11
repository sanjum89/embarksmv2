import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogChapterContent, ChapterSection, DiagnosticQuestion } from "./useCatalogChapter";

interface State {
  chapters: CatalogChapterContent[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch ALL chapter rows for a single module — used by the Quick Diagnostic
 * so we can assemble questions sourced from every chapter that's being
 * skipped, not just the first one.
 */
export function useCatalogChaptersForModule(
  accountId: string | null | undefined,
  moduleCode: string | null | undefined,
): State {
  const [state, setState] = useState<State>({ chapters: [], isLoading: false, error: null });

  useEffect(() => {
    if (!accountId || !moduleCode) {
      setState({ chapters: [], isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    (async () => {
      try {
        const { data, error } = await supabase
          .from("catalog_chapters")
          .select(
            "chapter_code, module_code, chapter_title, content_type, estimated_time_minutes, learning_objective, chapter_summary, realistic_content_outline, practical_activity, reflection_prompt, chapter_long_form_content, content_sections, diagnostic_questions, display_order",
          )
          .eq("account_id", accountId)
          .eq("module_code", moduleCode)
          .order("display_order", { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const chapters: CatalogChapterContent[] = (data ?? []).map((d: any) => ({
          chapterCode: d.chapter_code,
          moduleCode: d.module_code,
          chapterTitle: d.chapter_title,
          contentType: d.content_type ?? "reading",
          estimatedTimeMinutes: d.estimated_time_minutes ?? 0,
          learningObjective: d.learning_objective ?? null,
          chapterSummary: d.chapter_summary ?? null,
          realisticContentOutline: d.realistic_content_outline ?? null,
          practicalActivity: d.practical_activity ?? null,
          reflectionPrompt: d.reflection_prompt ?? null,
          longFormContent: d.chapter_long_form_content ?? null,
          contentSections: Array.isArray(d.content_sections)
            ? (d.content_sections as ChapterSection[])
            : [],
          diagnosticQuestions: Array.isArray(d.diagnostic_questions)
            ? (d.diagnostic_questions as DiagnosticQuestion[])
            : [],
        }));
        setState({ chapters, isLoading: false, error: null });
      } catch (e: any) {
        if (!cancelled) {
          setState({ chapters: [], isLoading: false, error: e?.message ?? "Failed to load chapters" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, moduleCode]);

  return state;
}
