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
import { formatAdaptationLabel, sanitizeReason, type ModuleAdaptation } from "@/lib/embarkAdaptation";
import type { UnifiedStep } from "./LearnPathContent";
import type { StepType } from "@/types/learning";

interface Props {
  track: JourneyTrack;
  cohortId: string;
  activeChapterCode: string | null;
}

function statusToStepStatus(s: JourneyModule["chapters"][number]["status"]): string {
  // Map our journey statuses onto the strings EmbarkChapterRow understands
  if (s === "completed") return "completed";
  if (s === "in_progress") return "in_progress";
  if (s === "locked") return "locked";
  return "available";
}

export function JourneyModuleAccordion({ track, cohortId, activeChapterCode }: Props) {
  const { substitute } = useContentSubstitution();

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
              {m.status === "locked" && m.prerequisiteTitle ? (
                <div className="rounded-lg bg-muted/50 border border-dashed border-border p-3 flex items-start gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Complete{" "}
                    <span className="font-medium text-foreground">
                      {substitute(m.prerequisiteTitle)}
                    </span>{" "}
                    to unlock this module.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  {m.chapters.map((c, sIdx) => {
                    const step: UnifiedStep = {
                      stepId: c.code,
                      moduleId: c.code,
                      type: "module" as StepType,
                      title: c.title,
                      description: "",
                      duration: c.minutes ? `${c.minutes} min` : undefined,
                      contentType: c.contentType,
                      status: statusToStepStatus(c.status),
                      skillTargetId: cohortId,
                      skillTargetTitle: m.title,
                      progress: m.pct,
                      referenceId: c.code,
                    };
                    return (
                      <EmbarkChapterRow
                        key={c.code}
                        step={step}
                        index={sIdx}
                        isActive={c.code === activeChapterCode}
                        isLast={sIdx === m.chapters.length - 1}
                      />
                    );
                  })}
                </div>
              )}
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
