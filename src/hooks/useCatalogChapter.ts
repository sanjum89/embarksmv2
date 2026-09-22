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
  /** Persona-specific condensed rewrite, loaded on demand when personaCode is supplied. */
  condensedBody: string | null;
  condensedLoading: boolean;
}

/**
 * Fetch the full content row for a single cohort chapter from `catalog_chapters`.
 * Returns null when the chapterCode doesn't exist (e.g. legacy non-cohort module).
 */
export function useCatalogChapter(
  accountId: string | null | undefined,
  chapterCode: string | null | undefined,
  options: { personaCode?: string | null; fetchCondensed?: boolean } = {}
): State {
  const { personaCode = null, fetchCondensed = false } = options;
  const [state, setState] = useState<State>({
    chapter: null,
    isLoading: false,
    error: null,
    condensedBody: null,
    condensedLoading: false,
  });

  useEffect(() => {
    if (!accountId || !chapterCode) {
      setState({ chapter: null, isLoading: false, error: null, condensedBody: null, condensedLoading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null, condensedBody: null, condensedLoading: false }));

    (async () => {
      try {
        const { data, error } = await supabase
          .from("catalog_chapters")
          .select(
            "chapter_code, module_code, chapter_title, content_type, estimated_time_minutes, learning_objective, chapter_summary, realistic_content_outline, practical_activity, reflection_prompt, chapter_long_form_content, content_sections, diagnostic_questions, condensed_by_persona"
          )
          .eq("account_id", accountId)
          .eq("chapter_code", chapterCode)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          if (!cancelled) setState({ chapter: null, isLoading: false, error: null, condensedBody: null, condensedLoading: false });
          return;
        }
        const cachedCondensed =
          personaCode && (data as any).condensed_by_persona
            ? ((data as any).condensed_by_persona as Record<string, string>)[personaCode] ?? null
            : null;
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
            condensedBody: cachedCondensed,
            condensedLoading: !cachedCondensed && !!personaCode && fetchCondensed,
          });
        }

        // On-demand: fetch a persona-condensed rewrite via edge function if not cached.
        if (!cachedCondensed && personaCode && fetchCondensed) {
          try {
            const { data: condensedData, error: condensedErr } = await supabase.functions.invoke(
              "embarksmv2-condense-chapter",
              { body: { accountId, chapterCode, personaCode } },
            );
            if (condensedErr) throw condensedErr;
            const body = (condensedData as any)?.body as string | undefined;
            if (!cancelled && body) {
              setState((s) => ({ ...s, condensedBody: body, condensedLoading: false }));
            } else if (!cancelled) {
              setState((s) => ({ ...s, condensedLoading: false }));
            }
          } catch (err) {
            console.warn("[useCatalogChapter] condense-chapter failed", err);
            if (!cancelled) setState((s) => ({ ...s, condensedLoading: false }));
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({
            chapter: null,
            isLoading: false,
            error: e?.message ?? "Failed to load chapter",
            condensedBody: null,
            condensedLoading: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, chapterCode, personaCode, fetchCondensed]);

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
  lens: ChapterLens = "full",
  options: { condensedBody?: string | null } = {}
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
    // Prefer a real persona-condensed rewrite when available.
    if (options.condensedBody && options.condensedBody.trim().length > 200) {
      return [
        `# ${ch.chapterTitle}`,
        `> Condensed for you — a shorter rewrite tailored to your background. The full chapter is still available if you want it.`,
        options.condensedBody.trim(),
        ch.practicalActivity ? `## Try it yourself\n${ch.practicalActivity}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    // Fallback to heuristic slice while the AI rewrite is being prepared.
    const applied = ch.contentSections.filter((s) => s.depth_level === "applied");
    const sections = applied.length > 0 ? applied : ch.contentSections.slice(-2);
    const body = sections
      .map((s) => `## ${s.heading}\n${s.body_md}`)
      .join("\n\n");
    return [
      `# ${ch.chapterTitle}`,
      `> Preparing your condensed view — showing the most relevant sections in the meantime.`,
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

/**
 * Build the Quick Diagnostic transcript for a WHOLE module from all of its
 * chapters. Picks one diagnostic question per chapter (round-robin, capped
 * at MAX_QUESTIONS) and tags each question with its source `chapterCode`
 * so the UI can reopen the chapters the learner answers wrong.
 */
export function composeDiagnosticTranscriptFromChapters(
  chapters: CatalogChapterContent[],
  moduleTitle: string,
): string {
  const MAX_QUESTIONS = 3;
  const tagged: DiagnosticQuestion[] = [];

  // Round-robin pull: 1st question of each chapter, then 2nd, ...
  let round = 0;
  while (tagged.length < MAX_QUESTIONS) {
    let pickedThisRound = 0;
    for (const ch of chapters) {
      if (tagged.length >= MAX_QUESTIONS) break;
      const pool = ch.diagnosticQuestions.length > 0
        ? ch.diagnosticQuestions
        : fallbackQuestions(ch);
      const q = pool[round];
      if (q) {
        tagged.push({ ...q, chapterCode: ch.chapterCode });
        pickedThisRound++;
      }
    }
    if (pickedThisRound === 0) break;
    round++;
  }

  if (tagged.length === 0 && chapters.length > 0) {
    // Last-ditch — should not happen because fallbackQuestions always returns 1
    tagged.push({ ...fallbackQuestions(chapters[0])[0], chapterCode: chapters[0].chapterCode });
  }

  const block = {
    type: "inline_quiz",
    data: {
      title: `${moduleTitle} — quick check`,
      questions: tagged.map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        chapterCode: q.chapterCode,
      })),
    },
  };

  return [
    `# ${moduleTitle} — Quick diagnostic`,
    `> Three questions across this module's chapters. Submit when you're ready — anything you miss, we'll reopen so you can read just those parts.`,
    `:::RICH_BLOCK${JSON.stringify(block)}:::`,
  ].join("\n\n");
}
