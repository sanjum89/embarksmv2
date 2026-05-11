import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { JourneyTrack } from "@/hooks/useLearnerJourney";

interface Props {
  tracks: JourneyTrack[];
  activeCode: string | null;
  onSelect: (code: string) => void;
}

export function JourneyTrackTabs({ tracks, activeCode, onSelect }: Props) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-1.5 pb-1">
        {tracks.map((t) => {
          const active = t.code === activeCode;
          const pct = Math.max(0, Math.min(100, t.pct));
          return (
            <button
              key={t.code}
              type="button"
              onClick={() => onSelect(t.code)}
              aria-label={`${t.name} ${t.completedChapters} of ${t.totalChapters} chapters`}
              className={cn(
                "relative shrink-0 inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-xs font-medium transition-colors overflow-hidden",
                active
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card text-foreground border-border hover:bg-muted"
              )}
            >
              {/* Inline progress fill at the bottom of the pill */}
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 bottom-0 h-[2px] transition-all",
                  active ? "bg-accent-foreground/40" : "bg-foreground/30"
                )}
                style={{ width: `${pct}%` }}
              />
              <span className="truncate max-w-[160px]">{t.name}</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center h-4 px-1.5 rounded-full text-[0.6rem] tabular-nums",
                  active
                    ? "bg-accent-foreground/15 text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.completedChapters}/{t.totalChapters}
              </span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
