import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MESSAGES = [
  "Retrieving your learning journey…",
  "Pulling your cohort and tracks…",
  "Personalizing your next steps…",
];

export function EmbarkLoadingState() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col items-center text-center pt-6 space-y-4">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-accent/10" />
            <div className="relative w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 min-h-[44px]">
            <p
              key={idx}
              className="text-sm font-medium text-foreground animate-fade-in"
            >
              {MESSAGES[idx]}
            </p>
            <p className="text-xs text-muted-foreground">
              Embark AI is preparing your personalized view
            </p>
          </div>
        </div>

        {/* Header card skeleton */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-2 w-full" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-2 flex-1" />
            ))}
          </div>
        </div>

        {/* Track tabs skeleton */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>

        {/* Module rows skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
