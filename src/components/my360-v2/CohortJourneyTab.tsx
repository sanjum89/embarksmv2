import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Lock, CheckCircle2, CircleDashed, PlayCircle, ChevronRight } from "lucide-react";
import type { CohortInfo, ModuleRow, AdaptationRow, LearnerProgressRow } from "@/hooks/useMy360Data";

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

export function CohortJourneyTab({ cohort, modules, adaptations, progress }: Props) {
  if (!cohort) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">Not enrolled in an active cohort.</Card>
    );
  }

  const adaptByModule = new Map(adaptations.map((a) => [a.module_code, a]));
  // Module-level progress: aggregate from chapter rows
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

  const visibleAdaptations = adaptations.filter((a) => a.visible_to_learner !== false);

  return (
    <div className="space-y-6">
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

      <div>
        <h3 className="text-sm font-semibold mb-3">Module journey</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m) => {
            const st = moduleStatus.get(m.module_code);
            const adapt = adaptByModule.get(m.module_code);
            return (
              <Card key={m.module_code} className="p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <StatusIcon status={st?.status} locked={st?.locked} />
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground truncate">{m.progression_stage ?? m.difficulty_level}</div>
                      <div className="text-sm font-medium leading-snug line-clamp-2">{m.module_title}</div>
                    </div>
                  </div>
                </div>
                {adapt && adapt.visible_to_learner !== false && (
                  <span className={`text-[10px] inline-block self-start px-1.5 py-0.5 rounded border ${ADAPT_TONE[adapt.adaptation_type] ?? ADAPT_TONE.full_module}`}>
                    {ADAPT_LABEL[adapt.adaptation_type] ?? adapt.adaptation_type}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {visibleAdaptations.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">Why your journey looks different</h3>
          <p className="text-xs text-muted-foreground mb-4">Personalisations applied to your path based on your background and prior experience.</p>
          <div className="space-y-3">
            {visibleAdaptations.map((a) => (
              <div key={a.module_code} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <Badge variant="outline" className={`shrink-0 ${ADAPT_TONE[a.adaptation_type] ?? ""}`}>
                  {ADAPT_LABEL[a.adaptation_type] ?? a.adaptation_type}
                </Badge>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground">{modules.find((m) => m.module_code === a.module_code)?.module_title ?? a.module_code}</div>
                  {a.reason && <div className="text-xs text-muted-foreground mt-0.5">{a.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatusIcon({ status, locked }: { status?: string; locked?: boolean }) {
  if (locked) return <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />;
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />;
  if (status === "in_progress") return <PlayCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />;
  return <CircleDashed className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />;
}
