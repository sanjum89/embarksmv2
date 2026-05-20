import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { JourneyTrack } from "@/hooks/useLearnerJourney";

interface Props {
  tracks: JourneyTrack[];
  activeCode: string | null;
  onSelect: (code: string) => void;
}

export function JourneyTrackCards({ tracks, activeCode, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
      {tracks.map((t) => {
        const pct = Math.max(0, Math.min(100, t.pct));
        const isActive = t.code === activeCode;
        const isCompleted = pct === 100;

        let eyebrow = "Up next";
        if (isCompleted) eyebrow = "Completed";
        else if (isActive) eyebrow = "In focus";
        else if (t.modules?.some?.((m) => m.status === "in_progress")) eyebrow = "In progress";

        return (
          <button
            key={t.code}
            type="button"
            onClick={() => onSelect(t.code)}
            aria-label={`${t.name} ${t.completedChapters} of ${t.totalChapters} chapters`}
            className={cn(
              "group relative text-left rounded-2xl border p-4 transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow-lg z-10"
                : isCompleted
                ? "bg-card text-foreground border-border hover:border-foreground/20"
                : "bg-accent/10 text-foreground border-accent/30 hover:bg-card",
            )}
          >
            {isActive && (
              <span className="absolute -top-2 left-4 inline-flex items-center rounded-full bg-accent text-accent-foreground text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 shadow-sm">
                Current track
              </span>
            )}

            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider font-semibold",
                  isActive
                    ? "text-accent"
                    : isCompleted
                    ? "text-muted-foreground"
                    : "text-accent",
                )}
              >
                {eyebrow}
              </span>
              {isCompleted && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>

            <h3
              className={cn(
                "mt-1.5 font-display text-base font-semibold leading-snug line-clamp-2",
                isActive ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {t.name}
            </h3>

            <div
              className={cn(
                "mt-3 flex items-baseline justify-between text-xs tabular-nums",
                isActive ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              <span>
                {t.completedChapters}/{t.totalChapters} chapters
              </span>
              <span
                className={cn(
                  "font-semibold",
                  isActive ? "text-accent" : isCompleted ? "text-foreground" : "text-foreground",
                )}
              >
                {pct}%
              </span>
            </div>

            <div
              className={cn(
                "mt-2 h-1 w-full overflow-hidden rounded-full",
                isActive ? "bg-primary-foreground/15" : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isActive ? "bg-accent" : isCompleted ? "bg-green-500" : "bg-primary",
                )}
                style={{ width: `${Math.max(pct, isActive ? 4 : 0)}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
