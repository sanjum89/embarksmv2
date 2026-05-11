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

      {/* Per-track segmented strip */}
      {tracks.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <div className="pt-1">
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1.5">
              Tracks
            </p>
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted gap-0.5">
              {tracks.map((t) => {
                const widthPct = Math.max(
                  4,
                  Math.round((t.totalChapters / totalChapters) * 100)
                );
                const isActive = t.code === activeTrackCode;
                return (
                  <Tooltip key={t.code}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelectTrack(t.code)}
                        style={{ width: `${widthPct}%` }}
                        className={cn(
                          "relative h-full transition-all overflow-hidden",
                          "bg-muted hover:bg-muted-foreground/20",
                          isActive && "ring-1 ring-accent ring-offset-1 ring-offset-card"
                        )}
                        aria-label={`${t.name} ${t.pct}%`}
                      >
                        <span
                          className={cn(
                            "absolute inset-y-0 left-0 transition-all",
                            isActive ? "bg-accent" : "bg-foreground/40"
                          )}
                          style={{ width: `${t.pct}%` }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-muted-foreground">
                        {t.completedChapters} of {t.totalChapters} chapters · {t.pct}%
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
