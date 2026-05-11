import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import type { JourneyCohort } from "@/hooks/useLearnerJourney";
import { useContentSubstitution } from "@/lib/contentSubstitution";

interface Props {
  cohort: JourneyCohort;
}

export function JourneyHeaderCard({ cohort }: Props) {
  const { substitute } = useContentSubstitution();

  const formatDue = (d?: string | null) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground">Your cohort</p>
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {substitute(cohort.title)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {cohort.completedModules} of {cohort.totalModules} modules
            <span className="mx-1.5">·</span>
            {cohort.completedChapters} of {cohort.totalChapters} chapters
            {cohort.dueDate && (
              <>
                <span className="mx-1.5">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due {formatDue(cohort.dueDate)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-semibold text-foreground tabular-nums leading-none">
            {cohort.overallPct}%
          </p>
        </div>
      </div>

      <Progress value={cohort.overallPct} className="h-1.5" />
    </div>
  );
}
