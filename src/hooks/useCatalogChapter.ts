import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChapterSection {
  section_code: string;
  heading: string;
  body_md: string;
  depth_level: "foundation" | "core" | "applied";
  tags: string[];
  time_minutes: number;
}

export interface DiagnosticQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  tags?: string[];
  /** Source chapter — used by the module-level Quick Diagnostic to know
   * which chapter to "reopen" if the learner answers wrong. */
  chapterCode?: string;
}

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
  contentSections: ChapterSection[];
  diagnosticQuestions: DiagnosticQuestion[];
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
            "chapter_code, module_code, chapter_title, content_type, estimated_time_minutes, learning_objective, chapter_summary, realistic_content_outline, practical_activity, reflection_prompt, chapter_long_form_content, content_sections, diagnostic_questions"
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
              contentSections: Array.isArray((data as any).content_sections)
                ? ((data as any).content_sections as ChapterSection[])
                : [],
              diagnosticQuestions: Array.isArray((data as any).diagnostic_questions)
                ? ((data as any).diagnostic_questions as DiagnosticQuestion[])
                : [],
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
 * Compose a structured markdown transcript for a chapter, shaped by `lens`:
 *   - "full"        → all sections (from `content_sections`) joined; falls back to long_form / outline
 *   - "condensed"   → only `applied` sections (microlearning) + key takeaways
 *   - "diagnostic"  → tiny intro + a real `inline_quiz` rich block built from `diagnostic_questions`
 *   - "evidence"    → ONLY the practical_activity prompt as a submission task
 */
export type ChapterLens = "full" | "condensed" | "diagnostic" | "evidence";

export function composeChapterTranscript(
  ch: CatalogChapterContent,
  lens: ChapterLens = "full"
): string {
  if (lens === "evidence") {
    return [
      `# ${ch.chapterTitle} — Evidence task`,
      `> Skip straight to the practice. Submit a short piece of work that shows you can apply this — no reading required.`,
      ch.learningObjective ? `**What this covers:** ${ch.learningObjective}` : "",
      ch.practicalActivity
        ? `## What to submit\n${ch.practicalActivity}`
        : `## What to submit\nWrite a short note (200-300 words) describing how you would apply this chapter's ideas to a real Rathbones client situation.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (lens === "diagnostic") {
    const intro = ch.learningObjective ?? ch.chapterSummary ?? "";
    const questions =
      ch.diagnosticQuestions.length > 0
        ? ch.diagnosticQuestions
        : fallbackQuestions(ch);
    const block = {
      type: "inline_quiz",
      data: {
        title: `${ch.chapterTitle} — quick check`,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      },
    };
    return [
      `# ${ch.chapterTitle} — Quick diagnostic`,
      `> Three questions to confirm you've got this. Pass and the module's done — no need to read it through.`,
      intro ? `## What this covers\n${intro}` : "",
      `:::RICH_BLOCK${JSON.stringify(block)}:::`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (lens === "condensed") {
    const applied = ch.contentSections.filter((s) => s.depth_level === "applied");
    const sections = applied.length > 0 ? applied : ch.contentSections.slice(-2);
    const body = sections
      .map((s) => `## ${s.heading}\n${s.body_md}`)
      .join("\n\n");
    return [
      `# ${ch.chapterTitle}`,
      `> Microlearning view — we've kept the parts most likely to be new for you and trimmed the basics your background already covers.`,
      body || (ch.longFormContent?.slice(0, 1500) ?? ""),
      ch.practicalActivity ? `## Try it yourself\n${ch.practicalActivity}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // full
  if (ch.contentSections.length > 0) {
    const body = ch.contentSections.map((s) => `## ${s.heading}\n${s.body_md}`).join("\n\n");
    return [`# ${ch.chapterTitle}`, body].join("\n\n");
  }
  if (ch.longFormContent && ch.longFormContent.trim().length > 200) {
    return ch.longFormContent.trim();
  }
  // Last-ditch stitch from legacy fields
  const parts: string[] = [`# ${ch.chapterTitle}`];
  if (ch.learningObjective) parts.push(`## Learning objective\n${ch.learningObjective}`);
  if (ch.chapterSummary) parts.push(`## Overview\n${ch.chapterSummary}`);
  if (ch.realisticContentOutline) parts.push(`## In this chapter\n${ch.realisticContentOutline}`);
  if (ch.practicalActivity) parts.push(`## Try it yourself\n${ch.practicalActivity}`);
  if (ch.reflectionPrompt) parts.push(`## Reflect\n${ch.reflectionPrompt}`);
  return parts.join("\n\n");
}

function fallbackQuestions(ch: CatalogChapterContent): DiagnosticQuestion[] {
  return [
    {
      question: `Which best summarises the focus of "${ch.chapterTitle}"?`,
      options: [
        ch.learningObjective ?? ch.chapterSummary ?? "Core concept of this chapter",
        "An unrelated topic from another module",
        "A general overview of UK politics",
        "None of the above",
      ],
      correctIndex: 0,
      explanation: "This chapter's stated learning objective.",
    },
  ];
}
