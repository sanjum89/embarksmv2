import { PickUpWhereYouLeftOffCard } from "./PickUpWhereYouLeftOffCard";
import { WeeklyDigestTile } from "./WeeklyDigestTile";
import { CohortPresenceChip } from "./CohortPresenceChip";
import { Lightbulb } from "lucide-react";

interface Topic {
  label: string;
  prompt: string;
}

const TOPICS: Topic[] = [
  { label: "What should I focus on today?", prompt: "What should I focus on today?" },
  { label: "Summarise my recent progress", prompt: "Summarise my recent learning progress" },
  { label: "Prep me for my next role play", prompt: "Help me prepare for my next role play" },
  { label: "Where am I falling behind?", prompt: "Where am I falling behind in my journey?" },
];

interface Props {
  onTopic: (prompt: string) => void;
  className?: string;
}

export function ChatContextRail({ onTopic, className }: Props) {
  return (
    <div className={className}>
      <div className="space-y-3">
        <PickUpWhereYouLeftOffCard />
        <WeeklyDigestTile />
        <CohortPresenceChip />

        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Lightbulb className="h-3 w-3" />
            Try asking
          </div>
          <div className="space-y-1">
            {TOPICS.map((t) => (
              <button
                key={t.label}
                onClick={() => onTopic(t.prompt)}
                className="w-full text-left text-[11px] text-foreground rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors leading-snug"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
