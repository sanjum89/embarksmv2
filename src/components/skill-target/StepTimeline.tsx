import type { StepItem } from "@/types/learning";
import { StepListItem } from "./StepListItem";
import { cn } from "@/lib/utils";

interface StepTimelineProps {
  steps: StepItem[];
  skillTargetId: string;
}

export function StepTimeline({ steps, skillTargetId }: StepTimelineProps) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-[1.9rem] top-10 bottom-6 w-0.5 bg-border" />

      {/* Accent overlay for completed portion */}
      {(() => {
        const lastCompletedIdx = sorted.reduce(
          (acc, s, i) => (s.status === "completed" || s.status === "skipped" ? i : acc),
          -1
        );
        if (lastCompletedIdx < 0) return null;
        const pct = ((lastCompletedIdx + 1) / sorted.length) * 100;
        return (
          <div
            className="absolute left-[1.9rem] top-10 w-0.5 gradient-accent rounded-full"
            style={{ height: `${pct}%` }}
          />
        );
      })()}

      <div className="relative z-10 flex flex-col gap-3">
        {sorted.map((step, i) => (
          <StepListItem
            key={step.id}
            step={step}
            index={i}
            skillTargetId={skillTargetId}
            isLast={i === sorted.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
