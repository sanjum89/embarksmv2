// Resolves an assessmentId to a runnable Assessment object, regardless of
// where it lives:
//   • legacy skill-target assessments (mockAssessments + skill-target steps)
//   • catalog_chapters quizzes (content_type = "quiz", e.g. *.midpoint)
//   • catalog_assessment_blueprints (module_post / milestone)
//
// Returns { assessment, sourceKind, moduleCode, chapterCode?, blueprintCode? }
// so callers can drive the shared post-submit pipeline (micro-learning,
// chapter reopen, lock).

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveAssessment, STEP_TO_ASSESSMENT } from "@/lib/assessmentGates";
import type { Assessment } from "@/types/learning";
import type { SkillTarget } from "@/types/learning";
import type { AssessmentSourceKind } from "@/lib/assessmentSubmission";

export interface ResolvedAssessmentContext {
  assessment: Assessment;
  sourceKind: AssessmentSourceKind;
  /** Parent module — required for assessment_instances + lock events. */
  moduleCode: string | null;
  /** When this assessment lives on a single chapter row (midpoint quiz). */
  chapterCode?: string;
  /** When this assessment is a catalog_assessment_blueprints row. */
  blueprintCode?: string;
  /** Tag → chapter codes lookup so the submit pipeline can reopen the right
   * chapters when an answer is wrong. */
  topicToChapters?: Record<string, string[]>;
}

interface State {
  resolved: ResolvedAssessmentContext | null;
  isLoading: boolean;
  error: string | null;
}

const SUB_PASSING = 70;

function buildFromDiagnosticQuestions(
  chapterCode: string,
  chapterTitle: string,
  moduleCode: string,
  rows: any[],
): Assessment {
  const questions = rows.map((q, i) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    return {
      id: `${chapterCode}-q${i + 1}`,
      question: String(q.question ?? `Question ${i + 1}`),
      options: opts.map((o: any) => String(o)),
      correctIndex: Number.isFinite(q.correctIndex) ? Number(q.correctIndex) : 0,
      topicTag: typeof q.tags?.[0] === "string" ? q.tags[0] : undefined,
    };
  });
  return {
    id: chapterCode,
    title: chapterTitle,
    type: "post",
    passingScore: SUB_PASSING,
    questions: questions.length
      ? questions
      : [
          {
            id: `${chapterCode}-q1`,
            question: `Which best describes the focus of "${chapterTitle}"?`,
            options: [
              "An applied principle from this chapter",
              "An unrelated regulatory topic",
              "A different module's content",
              "None of the above",
            ],
            correctIndex: 0,
          },
        ],
  };
}

function buildFromBlueprint(
  blueprintCode: string,
  title: string,
  passingScore: number,
  topicOutline: any[],
  moduleCode: string,
  scope: "module_post" | "milestone",
): { assessment: Assessment; topicToChapters: Record<string, string[]> } {
  // topic_outline entries vary but typically look like
  //   { topic: "...", weight: 0.4, linked_chapters: ["bk1.c2", "bk1.c3"] }
  const topicToChapters: Record<string, string[]> = {};
  const questions: Assessment["questions"] = [];

  const list = Array.isArray(topicOutline) ? topicOutline : [];
  list.forEach((entry, i) => {
    const topic = String(entry?.topic ?? entry?.name ?? `Topic ${i + 1}`).trim() || `Topic ${i + 1}`;
    const linked = Array.isArray(entry?.linked_chapters)
      ? entry.linked_chapters.filter((c: any) => typeof c === "string")
      : [];
    if (linked.length) topicToChapters[topic] = linked;
    questions.push({
      id: `${blueprintCode}-q${i * 2 + 1}`,
      question: `Which best describes the core idea behind ${topic}?`,
      options: [
        "It's an optional advanced topic",
        `It's a working principle for ${topic.toLowerCase()} you apply in client situations`,
        "It only matters at audit time",
        "It's covered by another team",
      ],
      correctIndex: 1,
      topicTag: topic,
    });
    questions.push({
      id: `${blueprintCode}-q${i * 2 + 2}`,
      question: `When applying ${topic}, the most reliable next step is to:`,
      options: [
        "Skip planning and act",
        "Assess the client's situation and constraints before deciding",
        "Defer the decision indefinitely",
        "Copy what a colleague did last time",
      ],
      correctIndex: 1,
      topicTag: topic,
    });
  });

  // Cap at 5 questions to keep the runner short.
  const trimmed = questions.slice(0, 5);

  return {
    assessment: {
      id: blueprintCode,
      title:
        scope === "milestone"
          ? `Milestone check — ${title}`
          : `Module assessment — ${title}`,
      type: "post",
      passingScore: passingScore || 80,
      questions: trimmed.length
        ? trimmed
        : [
            {
              id: `${blueprintCode}-q1`,
              question: `Which best describes a key practice for ${title}?`,
              options: [
                "Apply it only when asked by Compliance",
                "Apply it consistently in client work and document the reasoning",
                "Treat it as optional once the module is finished",
                "Defer to your manager every time",
              ],
              correctIndex: 1,
              topicTag: title,
            },
          ],
    },
    topicToChapters,
  };
}

export function useResolvedAssessment(
  accountId: string | null | undefined,
  assessmentId: string | null | undefined,
  skillTargets: SkillTarget[],
): State {
  const [state, setState] = useState<State>({ resolved: null, isLoading: false, error: null });

  useEffect(() => {
    if (!assessmentId) {
      setState({ resolved: null, isLoading: false, error: null });
      return;
    }

    // 1. Legacy skill-target / static catalog path — synchronous.
    const legacyId = STEP_TO_ASSESSMENT[assessmentId] ?? assessmentId;
    const legacy = resolveAssessment(legacyId, skillTargets);
    if (legacy) {
      setState({
        resolved: { assessment: legacy, sourceKind: "module_post", moduleCode: null },
        isLoading: false,
        error: null,
      });
      return;
    }

    if (!accountId) {
      setState({ resolved: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ resolved: null, isLoading: true, error: null });

    (async () => {
      try {
        // 2. catalog_chapters quiz path (e.g. bk1.midpoint).
        const { data: chapterRow } = await supabase
          .from("catalog_chapters")
          .select("chapter_code, module_code, chapter_title, content_type, diagnostic_questions")
          .eq("account_id", accountId)
          .eq("chapter_code", assessmentId)
          .maybeSingle();
        if (chapterRow && (chapterRow.content_type === "quiz" || (chapterRow.diagnostic_questions as any[])?.length)) {
          const questions = Array.isArray(chapterRow.diagnostic_questions)
            ? (chapterRow.diagnostic_questions as any[])
            : [];
          const assessment = buildFromDiagnosticQuestions(
            chapterRow.chapter_code,
            chapterRow.chapter_title,
            chapterRow.module_code,
            questions,
          );
          if (!cancelled) {
            setState({
              resolved: {
                assessment,
                sourceKind: "midpoint",
                moduleCode: chapterRow.module_code,
                chapterCode: chapterRow.chapter_code,
              },
              isLoading: false,
              error: null,
            });
          }
          return;
        }

        // 3. catalog_assessment_blueprints path.
        const { data: bp } = await supabase
          .from("catalog_assessment_blueprints")
          .select(
            "blueprint_code, module_code, scope, assessment_title, passing_score, topic_outline",
          )
          .eq("account_id", accountId)
          .eq("blueprint_code", assessmentId)
          .maybeSingle();
        if (bp) {
          const scope = (bp.scope === "milestone" ? "milestone" : "module_post") as
            | "module_post"
            | "milestone";
          const built = buildFromBlueprint(
            bp.blueprint_code,
            bp.assessment_title ?? bp.module_code,
            bp.passing_score ?? 80,
            Array.isArray(bp.topic_outline) ? (bp.topic_outline as any[]) : [],
            bp.module_code,
            scope,
          );
          if (!cancelled) {
            setState({
              resolved: {
                assessment: built.assessment,
                sourceKind: scope,
                moduleCode: bp.module_code,
                blueprintCode: bp.blueprint_code,
                topicToChapters: built.topicToChapters,
              },
              isLoading: false,
              error: null,
            });
          }
          return;
        }

        if (!cancelled) setState({ resolved: null, isLoading: false, error: null });
      } catch (e: any) {
        if (!cancelled)
          setState({ resolved: null, isLoading: false, error: e?.message ?? "Failed to load assessment" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, assessmentId, skillTargets]);

  return state;
}
