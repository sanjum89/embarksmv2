import type { SkillTarget, StepItem } from "@/types/learning";
import type { ManagerSkillTarget } from "@/data/managerSkillTargets";

export function convertManagerTarget(
  target: ManagerSkillTarget,
  userId: string
): SkillTarget {
  const steps: StepItem[] = target.steps.map((s, i) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    description: s.description,
    order: i,
    skippable: !!s.skipCondition,
    skipCondition: s.skipCondition,
    status: i === 0 ? "available" : "locked",
    duration: s.duration,
    referenceId: s.referenceId,
  }));

  return {
    id: `user-${target.id}-${Date.now()}`,
    title: target.title,
    description: target.description,
    category: target.category,
    assignedTo: [userId],
    steps,
    progress: 0,
  };
}
