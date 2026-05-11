import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex gap-1.5 pb-2">
        {tracks.map((t) => {
          const active = t.code === activeCode;
          return (
            <button
              key={t.code}
              type="button"
              onClick={() => onSelect(t.code)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card text-foreground border-border hover:bg-muted"
              )}
            >
              <span className="truncate max-w-[160px]">{t.name}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "h-4 px-1.5 text-[0.6rem] tabular-nums",
                  active && "bg-accent-foreground/15 text-accent-foreground"
                )}
              >
                {t.pct}%
              </Badge>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
