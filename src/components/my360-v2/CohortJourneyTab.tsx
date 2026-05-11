import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Calendar, Lock, CheckCircle2, CircleDashed, PlayCircle, ChevronRight } from "lucide-react";
import type { CohortInfo, ModuleRow, AdaptationRow, LearnerProgressRow } from "@/hooks/useMy360Data";
import { cn } from "@/lib/utils";

interface Props {
  cohort?: CohortInfo;
  modules: ModuleRow[];
  adaptations: AdaptationRow[];
  progress: LearnerProgressRow[];
}

const ADAPT_LABEL: Record<string, string> = {
  diagnostic_only: "Diagnostic only",
  microlearning: "Microlearning",
  skip_after_validation: "Skip after validation",
  full_module: "Full module",
  emphasis: "Emphasis",
};

const ADAPT_TONE: Record<string, string> = {
  diagnostic_only: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  microlearning: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  skip_after_validation: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  full_module: "bg-muted text-muted-foreground border-border",
  emphasis: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

const STAGE_ORDER = ["foundation", "core", "advanced", "mastery", "stretch"];

function stageRank(s?: string | null) {
  if (!s) return 99;
  const i = STAGE_ORDER.indexOf(s.toLowerCase());
  return i === -1 ? 50 : i;
}

function titleCase(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Filter = "all" | "in_progress" | "adapted" | "locked";

export function CohortJourneyTab({ cohort, modules, adaptations, progress }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  if (!cohort) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Not enrolled in an active cohort.</Card>;
  }

  const adaptByModule = new Map(adaptations.map((a) => [a.module_code, a]));
  const moduleStatus = new Map<string, { status: string; locked: boolean }>();
  for (const p of progress) {
    if (!p.module_code) continue;
    const existing = moduleStatus.get(p.module_code) ?? { status: "not_started", locked: false };
    if (p.status === "completed" || p.status === "in_progress") {
      existing.status = p.status === "completed" && existing.status !== "in_progress" ? "completed" : "in_progress";
    }
    if (p.is_locked) existing.locked = true;
    moduleStatus.set(p.module_code, existing);
  }

  const completedCount = modules.filter((m) => moduleStatus.get(m.module_code)?.status === "completed").length;
  const pctComplete = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  // Group modules by stage
  const stageGroups = useMemo(() => {
    const groups = new Map<string, ModuleRow[]>();
    for (const m of modules) {
      const stage = m.progression_stage ?? "Other";
      if (!groups.has(stage)) groups.set(stage, []);
      groups.get(stage)!.push(m);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => stageRank(a) - stageRank(b))
      .map(([stage, mods]) => {
        const done = mods.filter((m) => moduleStatus.get(m.module_code)?.status === "completed").length;
        const inProgress = mods.some((m) => moduleStatus.get(m.module_code)?.status === "in_progress");
        const pct = mods.length ? Math.round((done / mods.length) * 100) : 0;
        return { stage, modules: mods, done, total: mods.length, pct, hasInProgress: inProgress };
      });
  }, [modules, progress]);

  const visibleAdaptations = adaptations.filter((a) => a.visible_to_learner !== false);

  const adaptCounts = useMemo(() => {
    const counts = new Map<string, AdaptationRow[]>();
    for (const a of visibleAdaptations) {
      if (!counts.has(a.adaptation_type)) counts.set(a.adaptation_type, []);
      counts.get(a.adaptation_type)!.push(a);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [adaptations]);

  const filterModule = (m: ModuleRow) => {
    const st = moduleStatus.get(m.module_code);
    if (filter === "in_progress") return st?.status === "in_progress";
    if (filter === "locked") return st?.locked;
    if (filter === "adapted") {
      const a = adaptByModule.get(m.module_code);
      return a && a.visible_to_learner !== false && a.adaptation_type !== "full_module";
    }
    return true;
  };

  const defaultOpenStages = stageGroups.filter((g) => g.hasInProgress).map((g) => g.stage);
  // If nothing in progress, open the first stage with incomplete work
  if (defaultOpenStages.length === 0) {
    const first = stageGroups.find((g) => g.done < g.total);
    if (first) defaultOpenStages.push(first.stage);
  }

  return (
    <div className="space-y-6">
      {/* Top summary */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">{cohort.cohort_title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{cohort.cohort_code}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Starts {cohort.start_date ?? "—"}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Due {cohort.due_date ?? "—"}</span>
              {cohort.common_assessment_date && (
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Common assessment {cohort.common_assessment_date}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums">{pctComplete}%</div>
            <div className="text-xs text-muted-foreground">{completedCount} / {modules.length} modules</div>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pctComplete}%` }} />
        </div>
        <div className="flex justify-end mt-4">
          <Button asChild size="sm">
            <Link to="/">Continue in Embark AI <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </Card>

      {/* Module journey */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="text-sm font-semibold">Module journey</h3>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-muted border border-border">
            {([
              ["all", "All"],
              ["in_progress", "In progress"],
              ["adapted", "Adapted"],
              ["locked", "Locked"],
            ] as [Filter, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-full transition-all",
                  filter === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Accordion type="multiple" defaultValue={defaultOpenStages} className="space-y-2">
          {stageGroups.map((g) => {
            const filtered = g.modules.filter(filterModule);
            return (
              <AccordionItem key={g.stage} value={g.stage} className="border border-border rounded-lg bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-left min-w-0">
                      <div className="text-sm font-semibold">{titleCase(g.stage)}</div>
                      <div className="text-xs text-muted-foreground">{g.done} / {g.total} complete · {g.pct}%</div>
                    </div>
                    <div className="ml-auto mr-3 hidden sm:flex items-center gap-2 w-32">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex-1">
                        <div className="h-full bg-primary" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2 pt-0">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-muted-foreground italic">No modules match this filter.</div>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {filtered.map((m) => {
                        const st = moduleStatus.get(m.module_code);
                        const adapt = adaptByModule.get(m.module_code);
                        return (
                          <li key={m.module_code} className="flex items-center gap-3 px-3 py-2.5">
                            <StatusIcon status={st?.status} locked={st?.locked} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium leading-snug truncate">{m.module_title}</div>
                            </div>
                            {adapt && adapt.visible_to_learner !== false && (
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", ADAPT_TONE[adapt.adaptation_type] ?? ADAPT_TONE.full_module)}>
                                {ADAPT_LABEL[adapt.adaptation_type] ?? adapt.adaptation_type}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Why your journey looks different - grouped */}
      {adaptCounts.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">Why your journey looks different</h3>
          <p className="text-xs text-muted-foreground mb-3">Personalisations applied based on your background and prior experience.</p>
          <Accordion type="multiple" className="space-y-1.5">
            {adaptCounts.map(([type, items]) => (
              <AccordionItem key={type} value={type} className="border border-border rounded-md overflow-hidden">
                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/30">
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="outline" className={cn("shrink-0", ADAPT_TONE[type])}>
                      {ADAPT_LABEL[type] ?? type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{items.length} module{items.length === 1 ? "" : "s"}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-2 pt-0">
                  <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                    {items.map((a) => (
                      <li key={a.module_code} className="text-xs">
                        <div className="font-medium text-foreground">
                          {modules.find((m) => m.module_code === a.module_code)?.module_title ?? a.module_code}
                        </div>
                        {a.reason && <div className="text-muted-foreground mt-0.5">{a.reason}</div>}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}
    </div>
  );
}

function StatusIcon({ status, locked }: { status?: string; locked?: boolean }) {
  if (locked) return <Lock className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  if (status === "in_progress") return <PlayCircle className="h-4 w-4 text-primary shrink-0" />;
  return <CircleDashed className="h-4 w-4 text-muted-foreground/60 shrink-0" />;
}
