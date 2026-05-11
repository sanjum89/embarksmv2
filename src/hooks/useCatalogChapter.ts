import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CatalogChapterContent {
  chapterCode: string;
  moduleCode: string;
  chapterTitle: string;
  contentType: string;
  estimatedTimeMinutes: number;
  learningObjective: string | null;
  chapterSummary: string | null;
  realisticContentOutline: string | null;
  practicalActivity: string | null;
  reflectionPrompt: string | null;
  longFormContent: string | null;
}

interface State {
  chapter: CatalogChapterContent | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch the full content row for a single cohort chapter from `catalog_chapters`.
 * Returns null when the chapterCode doesn't exist (e.g. legacy non-cohort module).
 */
export function useCatalogChapter(
  accountId: string | null | undefined,
  chapterCode: string | null | undefined
): State {
  const [state, setState] = useState<State>({ chapter: null, isLoading: false, error: null });

  useEffect(() => {
    if (!accountId || !chapterCode) {
      setState({ chapter: null, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    (async () => {
      try {
        const { data, error } = await supabase
          .from("catalog_chapters")
          .select(
            "chapter_code, module_code, chapter_title, content_type, estimated_time_minutes, learning_objective, chapter_summary, realistic_content_outline, practical_activity, reflection_prompt, chapter_long_form_content"
          )
          .eq("account_id", accountId)
          .eq("chapter_code", chapterCode)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          if (!cancelled) setState({ chapter: null, isLoading: false, error: null });
          return;
        }
        if (!cancelled) {
          setState({
            chapter: {
              chapterCode: data.chapter_code,
              moduleCode: data.module_code,
              chapterTitle: data.chapter_title,
              contentType: data.content_type ?? "reading",
              estimatedTimeMinutes: data.estimated_time_minutes ?? 0,
              learningObjective: data.learning_objective ?? null,
              chapterSummary: data.chapter_summary ?? null,
              realisticContentOutline: data.realistic_content_outline ?? null,
              practicalActivity: data.practical_activity ?? null,
              reflectionPrompt: data.reflection_prompt ?? null,
              longFormContent: (data as any).chapter_long_form_content ?? null,
            },
            isLoading: false,
            error: null,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({
            chapter: null,
            isLoading: false,
            error: e?.message ?? "Failed to load chapter",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, chapterCode]);

  return state;
}

/**
 * Compose a structured markdown transcript from the DB chapter row.
 * Prefers the long-form lesson body when present; otherwise stitches the structured fields.
 */
export function composeChapterTranscript(ch: CatalogChapterContent): string {
  if (ch.longFormContent && ch.longFormContent.trim().length > 200) {
    return ch.longFormContent.trim();
  }
  const parts: string[] = [`# ${ch.chapterTitle}`];
  if (ch.learningObjective) parts.push(`## Learning objective\n${ch.learningObjective}`);
  if (ch.chapterSummary) parts.push(`## Overview\n${ch.chapterSummary}`);
  if (ch.realisticContentOutline) parts.push(`## In this chapter\n${ch.realisticContentOutline}`);
  if (ch.practicalActivity) parts.push(`## Try it yourself\n${ch.practicalActivity}`);
  if (ch.reflectionPrompt) parts.push(`## Reflect\n${ch.reflectionPrompt}`);
  return parts.join("\n\n");
}
