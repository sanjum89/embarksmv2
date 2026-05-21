import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { StaggerList, StaggerItem } from "@/components/motion/Motion";
import type { JourneyTrack } from "@/hooks/useLearnerJourney";

interface Props {
  tracks: JourneyTrack[];
  activeCode: string | null;
  onSelect: (code: string) => void;
}

const PER_PAGE = 3;

export function JourneyTrackCards({ tracks, activeCode, onSelect }: Props) {
  const pages = useMemo(() => {
    const out: JourneyTrack[][] = [];
    for (let i = 0; i < tracks.length; i += PER_PAGE) {
      out.push(tracks.slice(i, i + PER_PAGE));
    }
    return out.length ? out : [[]];
  }, [tracks]);

  const activeIndex = useMemo(
    () => tracks.findIndex((t) => t.code === activeCode),
    [tracks, activeCode],
  );

  const [page, setPage] = useState(0);

  useEffect(() => {
    if (activeIndex < 0) return;
    const next = Math.floor(activeIndex / PER_PAGE);
    setPage((p) => (p === next ? p : next));
  }, [activeIndex]);

  const totalPages = pages.length;
  const safePage = Math.min(page, totalPages - 1);
  const visible = pages[safePage] ?? [];
  const hasPrev = safePage > 0;
  const hasNext = safePage < totalPages - 1;

  return (
    <div className="pt-2">
      {/* Desktop: paged 3-up grid with side rails */}
      <div className="hidden sm:flex items-stretch gap-2">
        {hasPrev && (
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous tracks"
            className={cn(
              "shrink-0 w-9 self-stretch flex items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors",
              "hover:bg-accent/10 hover:border-accent/40 hover:text-foreground",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <StaggerList
          key={safePage}
          className="flex-1 min-w-0 grid grid-cols-3 gap-3 items-stretch"
        >
          {visible.map((t) => (
            <StaggerItem key={t.code} className="h-full">
              <TrackCard t={t} isActive={t.code === activeCode} onSelect={onSelect} />
            </StaggerItem>
          ))}
        </StaggerList>

        {hasNext && (
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next tracks"
            className={cn(
              "shrink-0 w-9 self-stretch flex items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors",
              "hover:bg-accent/10 hover:border-accent/40 hover:text-foreground",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile: snap-scroll row, 1.2 cards visible */}
      <div className="sm:hidden -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tracks.map((t) => (
            <div key={t.code} className="basis-[82%] shrink-0 snap-start">
              <TrackCard t={t} isActive={t.code === activeCode} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TrackCardProps {
  t: JourneyTrack;
  isActive: boolean;
  onSelect: (code: string) => void;
}

function TrackCard({ t, isActive, onSelect }: TrackCardProps) {
  const pct = Math.max(0, Math.min(100, t.pct));
  const isCompleted = pct === 100;

  let eyebrow = "Up next";
  if (isCompleted) eyebrow = "Completed";
  else if (isActive) eyebrow = "In focus";
  else if (t.modules?.some?.((m) => m.status === "in_progress")) eyebrow = "In progress";

  return (
    <button
      type="button"
      onClick={() => onSelect(t.code)}
      aria-label={`${t.name} ${t.completedChapters} of ${t.totalChapters} chapters`}
      className={cn(
        "group relative w-full h-full text-left rounded-2xl border p-4 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow-lg z-10"
          : isCompleted
          ? "bg-card text-foreground border-border hover:border-foreground/20"
          : "bg-accent/10 text-foreground border-accent/30 hover:bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider font-semibold",
            isActive
              ? "text-primary-foreground/80"
              : isCompleted
              ? "text-muted-foreground"
              : "text-accent",
          )}
        >
          {eyebrow}
        </span>
        {isCompleted && (
          <span
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full",
              isActive
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-green-500/15 text-green-600",
            )}
          >
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>

      <h3
        className={cn(
          "mt-1.5 font-display text-base font-semibold leading-snug line-clamp-2 min-h-[2.6em]",
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
            isActive ? "text-accent" : "text-foreground",
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
}
