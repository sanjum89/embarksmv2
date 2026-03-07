import type { StepItem } from "@/types/learning";
import { StepListItem } from "./StepListItem";

interface StepTimelineProps {
  steps: StepItem[];
  skillTargetId: string;
}

export function StepTimeline({ steps, skillTargetId }: StepTimelineProps) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  // Find last completed/skipped index for accent coloring
  const lastCompletedIdx = sorted.reduce(
    (acc, s, i) => (s.status === "completed" || s.status === "skipped" ? i : acc),
    -1
  );

  return (
    <div className="flex flex-col">
      {sorted.map((step, i) => (
        <StepListItem
          key={step.id}
          step={step}
          index={i}
          skillTargetId={skillTargetId}
          isLast={i === sorted.length - 1}
          showAccentLine={i <= lastCompletedIdx && i < sorted.length - 1}
        />
      ))}
    </div>
  );
}
