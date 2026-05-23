import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Lock, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { EmbarkChapterRow } from "./LearnPathChapterRow";
import type { JourneyModule, JourneyTrack } from "@/hooks/useLearnerJourney";
import { formatAdaptationLabel, sanitizeReason, adaptationExplanation, type ModuleAdaptation } from "@/lib/embarkAdaptation";
import type { UnifiedStep } from "./LearnPathContent";
import type { StepType } from "@/types/learning";
import { useDiagnosticReopens } from "@/store/useDiagnosticReopens";

interface Props {
  track: JourneyTrack;
  cohortId: string;
  activeChapterCode: string | null;
}

function statusToStepStatus(s: string): string {
  // Map our journey statuses onto the strings EmbarkChapterRow understands.
  // We allow "skipped" / "available" too, even though the canonical type doesn't.
  if (s === "completed") return "completed";
  if (s === "in_progress") return "in_progress";
  if (s === "locked") return "locked";
  if (s === "skipped") return "skipped";
  if (s === "available") return "available";
  return "available";
}

export function JourneyModuleAccordion({ track, cohortId, activeChapterCode }: Props) {
  const { substitute } = useContentSubstitution();
  const diagState = useDiagnosticReopens();

  // Default-expand the module containing the active chapter, otherwise the first
  // in-progress / up-next module.
  const defaultOpen = useMemo(() => {
    const withActive = track.modules.find((m) =>
      m.chapters.some((c) => c.code === activeChapterCode)
    );
    if (withActive) return [withActive.code];
    const inProgress = track.modules.find((m) => m.status === "in_progress");
    if (inProgress) return [inProgress.code];
    const upNext = track.modules.find((m) => m.status === "up_next");
    if (upNext) return [upNext.code];
    return track.modules.length > 0 ? [track.modules[0].code] : [];
  }, [track, activeChapterCode]);

  const [open, setOpen] = useState<string[]>(defaultOpen);
  useEffect(() => {
    setOpen((prev) => Array.from(new Set([...prev, ...defaultOpen])));
  }, [defaultOpen]);

  // Tour helper: expand every module so the tour can spotlight lens pills
  // (Condensed / Quick Diagnostic / Evidence Task) regardless of which module
  // they live in.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ moduleCode?: string }>).detail;
      if (detail?.moduleCode) {
        setOpen((prev) => (prev.includes(detail.moduleCode!) ? prev : [...prev, detail.moduleCode!]));
        // Scroll the requested module into view after expansion.
        requestAnimationFrame(() => {
          const el = document.querySelector(
            `[data-module-code="${CSS.escape(detail.moduleCode!)}"]`,
          ) as HTMLElement | null;
          el?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
        return;
      }
      setOpen(track.modules.map((m) => m.code));
    };
    window.addEventListener("embark:tour-expand-all-modules", handler);
    return () => window.removeEventListener("embark:tour-expand-all-modules", handler);
  }, [track.modules]);

  if (track.modules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-6 text-center">
        No modules in this track yet.
      </p>
    );
  }

  return (
    <Accordion
      type="multiple"
      value={open}
      onValueChange={setOpen}
      className="space-y-2"
    >
      {track.modules.map((m, idx) => {
        const numberLabel = String(idx + 1).padStart(2, "0");
        return (
          <AccordionItem
            key={m.code}
            value={m.code}
            data-module-code={m.code}
            data-module-title={m.title}
            className={cn(
              "rounded-xl border border-border bg-card overflow-hidden transition-shadow",
              "data-[state=open]:shadow-sm",
              m.status === "in_progress" && "ring-1 ring-accent/40"
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
              <div className="flex-1 flex items-center gap-3 min-w-0 pr-3">
                <div
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0",
                    m.status === "completed" && "bg-green-500/15 text-green-600",
                    m.status === "in_progress" && "bg-accent/15 text-accent",
                    m.status === "up_next" && "bg-muted text-muted-foreground",
                    m.status === "locked" && "bg-muted text-muted-foreground"
                  )}
                >
                  {m.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : m.status === "locked" ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    numberLabel
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {substitute(m.title)}
                    </h3>
                    <StatusPill status={m.status} />
                    {m.isStretch && (
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[0.65rem] border-amber-300 text-amber-700 dark:text-amber-300"
                      >
                        STRETCH
                      </Badge>
                    )}
                    {m.adaptation && <AdaptationBadge adaptation={m.adaptation} />}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {m.completedChapters} of {m.totalChapters} chapter
                      {m.totalChapters !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Progress value={m.pct} className="h-1 mt-2 max-w-xs" />
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4 pt-0">
              {m.status === "locked" && m.prerequisiteTitle && (
                <div className="rounded-lg bg-muted/50 border border-dashed border-border p-3 flex items-start gap-2 mb-3">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Complete{" "}
                    <span className="font-medium text-foreground">
                      {substitute(m.prerequisiteTitle)}
                    </span>{" "}
                    to unlock this module. Preview of what's inside:
                  </p>
                </div>
              )}
              <div className={cn("space-y-1 pt-1", m.status === "locked" && "opacity-80")}>
                  {(() => {
                    const lensType = m.adaptation?.adaptationType ?? "full_module";
                    const recorded = diagState[m.code];
                    const displayChapters = buildLensChapters(m.code, m.chapters, lensType, recorded);
                    return displayChapters.map((c, sIdx) => {
                      const isAssessment =
                        c.contentType === "assessment" ||
                        c.contentType === "diagnostic" ||
                        c.contentType === "quiz" ||
                        c.code.endsWith(".midpoint") ||
                        c.code.endsWith(".bp_post") ||
                        c.code.endsWith(".bp_mid") ||
                        (c as any).assessmentScore != null;
                      const step: UnifiedStep & { lensState?: string } = {
                        stepId: c.code,
                        moduleId: c.code,
                        type: (isAssessment ? "assessment" : "module") as StepType,
                        title: c.title,
                        description: "",
                        duration: c.minutes ? `${c.minutes} min` : undefined,
                        contentType: c.contentType,
                        status: statusToStepStatus(c.status as any),
                        skillTargetId: cohortId,
                        skillTargetTitle: m.title,
                        progress: m.pct,
                        referenceId: c.code,
                        lensState: (c as any).lensState,
                        pendingSkip: (c as any).pendingSkip,
                        diagResult: (c as any).diagResult,
                        assessmentScore: (c as any).assessmentScore,
                        assessmentPassed: (c as any).assessmentPassed,
                        assessmentPassingScore: (c as any).assessmentPassingScore,
                      };
                      return (
                        <EmbarkChapterRow
                          key={c.code}
                          step={step}
                          index={sIdx}
                          isActive={c.code === activeChapterCode}
                          isLast={sIdx === displayChapters.length - 1}
                        />
                      );
                    });

                  })()}
                </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function StatusPill({ status }: { status: JourneyModule["status"] }) {
  if (status === "completed") {
    return (
      <Badge className="h-5 px-1.5 text-[0.65rem] bg-green-500/15 text-green-600 hover:bg-green-500/15 border-0">
        COMPLETED
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge className="h-5 px-1.5 text-[0.65rem] bg-accent text-accent-foreground hover:bg-accent border-0">
        IN PROGRESS
      </Badge>
    );
  }
  if (status === "locked") {
    return (
      <Badge variant="outline" className="h-5 px-1.5 text-[0.65rem] gap-1">
        <Lock className="h-2.5 w-2.5" /> LOCKED
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="h-5 px-1.5 text-[0.65rem]">
      UP NEXT
    </Badge>
  );
}

type DiagSnap = { submitted: boolean; reopened: Set<string>; total: number; correct: number };
type LensChapter = JourneyModule["chapters"][number] & {
  lensState?: string;
  pendingSkip?: boolean;
  diagResult?: { correct: number; total: number; reopenedCount: number };
};

/**
 * Reshape the chapter list based on the persona's delivery lens.
 * Skip cap: at most MAX_LENS_SKIPS foundational chapters are eligible to be
 * skipped/covered by a single diagnostic or evidence signal. Remaining
 * chapters always render normally — so doing one assessment never silently
 * removes 8+ chapters of work.
 */
const MAX_LENS_SKIPS = 3;

function buildLensChapters(
  moduleCode: string,
  chapters: JourneyModule["chapters"],
  lens: ModuleAdaptation["adaptationType"],
  diag?: DiagSnap,
): LensChapter[] {
  if (chapters.length === 0) return chapters as LensChapter[];

  if (lens === "diagnostic_only") {
    const submitted = !!diag?.submitted;
    const reopened = diag?.reopened ?? new Set<string>();
    const skipCount = Math.min(MAX_LENS_SKIPS, chapters.length);
    const synthetic: LensChapter = {
      code: `__diag::${moduleCode}`,
      title: `Quick diagnostic — 3 questions (skips up to ${skipCount} chapters)`,
      contentType: "diagnostic",
      minutes: 5,
      status: submitted ? ("completed" as any) : ("in_progress" as any),
      displayOrder: -1,
      lensState: "synthetic_diagnostic",
      diagResult: submitted
        ? {
            correct: diag!.correct,
            total: diag!.total,
            reopenedCount: diag!.reopened.size,
          }
        : undefined,
    } as LensChapter;
    const real: LensChapter[] = chapters.map((c, idx) => {
      // Only the first N chapters are diagnostic-eligible. Remaining chapters
      // always remain required — they render with their own status untouched.
      const eligible = idx < skipCount;
      if (!eligible) return { ...c };
      if (!submitted) {
        return { ...c, lensState: "skipped_by_diagnostic", pendingSkip: true };
      }
      if (reopened.has(c.code)) {
        return { ...c, status: "in_progress" as any, lensState: "reopened_after_wrong" };
      }
      return { ...c, status: "skipped" as any, lensState: "skipped_by_diagnostic" };
    });
    return [synthetic, ...real];
  }

  if (lens === "evidence_required") {
    const first = chapters[0];
    const skipCount = Math.min(MAX_LENS_SKIPS, chapters.length);
    const synthetic: LensChapter = {
      ...first,
      code: `__evi::${moduleCode}`,
      title: `Submit evidence — covers the first ${skipCount} foundation chapters`,
      minutes: 15,
      contentType: "evidence",
      lensState: "synthetic_evidence",
    };
    const real: LensChapter[] = chapters.map((c, idx) => {
      // Only the first N chapters are covered by the evidence task. The rest
      // remain required reading regardless of evidence outcome.
      if (idx >= skipCount) return { ...c };
      const committed = (c.status as any) === "skipped";
      if (committed) {
        return { ...c, lensState: "covered_by_evidence" };
      }
      return { ...c, lensState: "covered_by_evidence", pendingSkip: true };
    });
    return [synthetic, ...real];
  }

  if (lens === "microlearning") {
    return chapters.map((c) => ({
      ...c,
      title: c.title,
      minutes: Math.max(5, Math.round((c.minutes || 25) * 0.4)),
    }));
  }
  return chapters as LensChapter[];
}

function AdaptationBadge({ adaptation }: { adaptation: ModuleAdaptation }) {
  const label = formatAdaptationLabel(adaptation.adaptationType);
  const tone: Record<ModuleAdaptation["adaptationType"], string> = {
    full_module: "bg-muted text-muted-foreground border-border",
    microlearning: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    diagnostic_only: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
    evidence_required: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    skip_after_validation: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  };
  // Don't show full_module — it's the default and adds noise
  if (adaptation.adaptationType === "full_module") return null;
  const reason = sanitizeReason(adaptation.reason || "");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          data-tour={adaptation.adaptationType === "microlearning" ? "lens-microlearning" : undefined}
          className={cn(
            "h-5 px-1.5 text-[0.65rem] rounded-md border inline-flex items-center gap-1 hover:opacity-80 transition-opacity",
            tone[adaptation.adaptationType]
          )}
          aria-label={`${label} — why?`}
        >
          {label}
          <Info className="h-2.5 w-2.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 text-xs space-y-2"
        side="top"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-semibold text-sm text-foreground">{label}</div>
        <p className="text-muted-foreground leading-relaxed">
          {adaptationExplanation(adaptation.adaptationType)}
        </p>
        {reason && reason.length > 0 && (
          <p className="text-muted-foreground leading-relaxed border-t border-border pt-2">
            <span className="font-medium text-foreground">Why for you: </span>
            {reason}
          </p>
        )}
        {adaptation.competencyName && (
          <div className="pt-1 border-t border-border space-y-0.5">
            <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              Competency this builds
            </div>
            <div className="font-medium text-foreground">{adaptation.competencyName}</div>
            {(adaptation.currentLevel != null || adaptation.requiredLevel != null) && (
              <div className="text-muted-foreground">
                Your current level {adaptation.currentLevel ?? "—"} · Target for this role {adaptation.requiredLevel ?? "—"}
              </div>
            )}
            {adaptation.validationNeeded && (
              <div className="text-amber-600 dark:text-amber-400">Validation needed before this counts</div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
