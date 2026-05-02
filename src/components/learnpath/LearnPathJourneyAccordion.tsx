import { useMemo, useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Play, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { useSkillTargets } from "@/contexts/SkillTargetsContext";
import { EmbarkChapterRow } from "./LearnPathChapterRow";
import type { UnifiedStep } from "./LearnPathContent";

interface Props {
  steps: UnifiedStep[];
  activeChapterId: string | null;
}

type FilterKey = "all" | "in_progress" | "completed" | "locked";

interface ModuleGroup {
  skillTargetId: string;
  title: string;
  steps: UnifiedStep[];
  completedCount: number;
  totalCount: number;
  progress: number;
  status: "completed" | "in_progress" | "up_next" | "locked";
  prerequisiteTitle?: string;
  dueDate?: string;
}

export function EmbarkJourneyAccordion({ steps, activeChapterId }: Props) {
  const { substitute } = useContentSubstitution();
  const { skillTargets } = useSkillTargets();
  const [filter, setFilter] = useState<FilterKey>("all");

  // Group steps by skill target while preserving order
  const groups: ModuleGroup[] = useMemo(() => {
    const map = new Map<string, ModuleGroup>();
    const order: string[] = [];

    for (const s of steps) {
      if (!map.has(s.skillTargetId)) {
        order.push(s.skillTargetId);
        const target = skillTargets.find((t) => t.id === s.skillTargetId);
        let prereqTitle: string | undefined;
        if (target?.prerequisiteId) {
          const prereq = skillTargets.find((t) => t.id === target.prerequisiteId);
          if (prereq) prereqTitle = substitute(prereq.title);
        }
        map.set(s.skillTargetId, {
          skillTargetId: s.skillTargetId,
          title: s.skillTargetTitle,
          steps: [],
          completedCount: 0,
          totalCount: 0,
          progress: 0,
          status: "up_next",
          prerequisiteTitle: prereqTitle,
          dueDate: target?.dueDate,
        });
      }
      const g = map.get(s.skillTargetId)!;
      g.steps.push(s);
    }

    for (const id of order) {
      const g = map.get(id)!;
      g.totalCount = g.steps.length;
      g.completedCount = g.steps.filter(
        (s) => s.status === "completed" || s.status === "skipped"
      ).length;
      g.progress = g.totalCount > 0 ? Math.round((g.completedCount / g.totalCount) * 100) : 0;

      const allLocked = g.steps.every((s) => s.status === "locked");
      const allDone = g.completedCount === g.totalCount && g.totalCount > 0;
      const hasActive = g.steps.some(
        (s) => s.status === "in_progress" || s.stepId === activeChapterId || s.moduleId === activeChapterId
      );

      if (allDone) g.status = "completed";
      else if (hasActive) g.status = "in_progress";
      else if (allLocked) g.status = "locked";
      else if (g.completedCount > 0) g.status = "in_progress";
      else g.status = "up_next";
    }

    return order.map((id) => map.get(id)!);
  }, [steps, skillTargets, activeChapterId, substitute]);

  // Overall stats
  const overall = useMemo(() => {
    const totalModules = groups.length;
    const completedModules = groups.filter((g) => g.status === "completed").length;
    const totalChapters = groups.reduce((sum, g) => sum + g.totalCount, 0);
    const completedChapters = groups.reduce((sum, g) => sum + g.completedCount, 0);
    const overallPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    return { totalModules, completedModules, totalChapters, completedChapters, overallPct };
  }, [groups]);

  // Default-expand the active module (or the first in-progress one)
  const defaultOpen = useMemo(() => {
    const activeGroup = groups.find((g) =>
      g.steps.some((s) => s.stepId === activeChapterId || s.moduleId === activeChapterId)
    );
    if (activeGroup) return [activeGroup.skillTargetId];
    const inProgress = groups.find((g) => g.status === "in_progress");
    if (inProgress) return [inProgress.skillTargetId];
    return groups.length > 0 ? [groups[0].skillTargetId] : [];
  }, [groups, activeChapterId]);

  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  // Sync when defaultOpen changes (e.g., active chapter changes)
  useEffect(() => {
    setOpenItems((prev) => Array.from(new Set([...prev, ...defaultOpen])));
  }, [defaultOpen]);

  // Filtering: dim modules that don't match
  const filteredIds = useMemo(() => {
    if (filter === "all") return new Set(groups.map((g) => g.skillTargetId));
    return new Set(
      groups
        .filter((g) => {
          if (filter === "in_progress") return g.status === "in_progress";
          if (filter === "completed") return g.status === "completed";
          if (filter === "locked") return g.status === "locked";
          return true;
        })
        .map((g) => g.skillTargetId)
    );
  }, [groups, filter]);

  const filterChips: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
    { key: "locked", label: "Locked" },
  ];

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Overall progress</p>
            <p className="text-sm font-medium text-foreground">
              {overall.completedModules} of {overall.totalModules} modules complete
              <span className="text-muted-foreground font-normal">
                {" · "}
                {overall.completedChapters} of {overall.totalChapters} chapters
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {overall.overallPct}%
            </p>
          </div>
        </div>
        <Progress value={overall.overallPct} className="h-1.5" />

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {filterChips.map((c) => (
            <Button
              key={c.key}
              variant={filter === c.key ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 text-xs rounded-full"
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Modules accordion */}
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="space-y-2"
      >
        {groups.map((g, idx) => {
          const dimmed = !filteredIds.has(g.skillTargetId);
          const numberLabel = String(idx + 1).padStart(2, "0");

          return (
            <AccordionItem
              key={g.skillTargetId}
              value={g.skillTargetId}
              className={cn(
                "rounded-xl border border-border bg-card overflow-hidden transition-opacity",
                "data-[state=open]:shadow-sm",
                dimmed && "opacity-40",
                g.status === "in_progress" && "ring-1 ring-accent/40"
              )}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
                <div className="flex-1 flex items-center gap-3 min-w-0 pr-3">
                  {/* Number badge */}
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0",
                      g.status === "completed" && "bg-green-500/15 text-green-600",
                      g.status === "in_progress" && "bg-accent/15 text-accent",
                      g.status === "up_next" && "bg-muted text-muted-foreground",
                      g.status === "locked" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {g.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : g.status === "locked" ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      numberLabel
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {substitute(g.title)}
                      </h3>
                      <StatusPill status={g.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {g.completedCount} of {g.totalCount} chapter
                        {g.totalCount !== 1 ? "s" : ""}
                      </span>
                      {g.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due {g.dueDate}
                        </span>
                      )}
                    </div>
                    <Progress value={g.progress} className="h-1 mt-2 max-w-xs" />
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4 pt-0">
                {g.status === "locked" && g.prerequisiteTitle ? (
                  <div className="rounded-lg bg-muted/50 border border-dashed border-border p-3 flex items-start gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Complete{" "}
                      <span className="font-medium text-foreground">
                        {g.prerequisiteTitle}
                      </span>{" "}
                      to unlock this module.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    {g.steps.map((s, sIdx) => (
                      <EmbarkChapterRow
                        key={s.stepId}
                        step={s}
                        index={sIdx}
                        isActive={
                          s.stepId === activeChapterId || s.moduleId === activeChapterId
                        }
                        isLast={sIdx === g.steps.length - 1}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function StatusPill({ status }: { status: ModuleGroup["status"] }) {
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
