import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import type { CohortInfo, ModuleRow, AdaptationRow, LearnerProgressRow } from "@/hooks/useMy360Data";
import { AskEmbarkButton } from "./AskEmbarkButton";

interface Props {
  cohort?: CohortInfo;
  modules: ModuleRow[];
  adaptations: AdaptationRow[];
  progress: LearnerProgressRow[];
  onJumpToTab: () => void;
}

export function CohortPreviewCard({ cohort, modules, adaptations, progress, onJumpToTab }: Props) {
  if (!cohort) return null;

  const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.module_code));
  const inProgress = new Set(progress.filter((p) => p.status === "in_progress").map((p) => p.module_code));
  const completedCount = modules.filter((m) => completed.has(m.module_code)).length;
  const pct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;
  const adaptedCount = adaptations.filter((a) => a.visible_to_learner !== false).length;

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-1 font-medium">Active cohort</div>
            <h2 className="text-xl font-semibold tracking-tight">{cohort.cohort_title}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
              {cohort.start_date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" />Starts {cohort.start_date}</span>}
              {cohort.due_date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" />Due {cohort.due_date}</span>}
              {adaptedCount > 0 && <span>· {adaptedCount} adaptations</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums leading-none">{pct}%</div>
            <div className="text-xs text-muted-foreground mt-1">{completedCount} / {modules.length} modules</div>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-5">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        {/* dot strip — quick visual of where she is */}
        <div className="flex items-center gap-1 mb-5 flex-wrap">
          {modules.map((m) => {
            const done = completed.has(m.module_code);
            const active = inProgress.has(m.module_code);
            return (
              <span
                key={m.module_code}
                title={m.module_title}
                className={`h-2 flex-1 min-w-[12px] rounded-full ${done ? "bg-primary" : active ? "bg-primary/50" : "bg-muted"}`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onJumpToTab}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background hover:border-primary/40 px-3 py-1.5 text-xs font-medium transition-colors"
          >
            See full journey <ChevronRight className="h-3 w-3" />
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Continue in Embark <ChevronRight className="h-3 w-3" />
          </Link>
          <AskEmbarkButton
            variant="ghost"
            className="ml-auto"
            context="My 360 › Cohort"
            prompt="Where am I in my cohort journey, what's been adapted for me, and what should I focus on next?"
          />
        </div>
      </div>
    </section>
  );
}
