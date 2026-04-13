import type { SkillTarget } from "@/types/learning";

export const SKILL_TARGET_BASE_ORDER: Record<string, number> = {
  "RAT-ST-INTRO-001": 0,
  "RAT-ST-BRIDGE-001": 1,
  "RAT-ST-001": 2,
  "RAT-ST-002": 3,
  "RAT-ST-003": 4,
};

function compareTargets<T extends Pick<SkillTarget, "id">>(
  a: T,
  b: T,
  originalIndex: Map<string, number>,
) {
  const orderA = SKILL_TARGET_BASE_ORDER[a.id] ?? 9999;
  const orderB = SKILL_TARGET_BASE_ORDER[b.id] ?? 9999;

  if (orderA !== orderB) return orderA - orderB;
  return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
}

export function getAssignedSkillTargetsForUser(targets: SkillTarget[], userId: string) {
  return targets.filter((target) => target.assignedTo?.includes(userId));
}

export function orderSkillTargets<T extends Pick<SkillTarget, "id" | "prerequisiteId">>(targets: T[]): T[] {
  const originalIndex = new Map(targets.map((target, index) => [target.id, index]));
  const byId = new Map(targets.map((target) => [target.id, target]));
  const incoming = new Map<string, number>();
  const dependents = new Map<string, T[]>();

  targets.forEach((target) => {
    incoming.set(target.id, 0);
    dependents.set(target.id, []);
  });

  targets.forEach((target) => {
    if (!target.prerequisiteId || !byId.has(target.prerequisiteId)) return;
    incoming.set(target.id, (incoming.get(target.id) ?? 0) + 1);
    dependents.get(target.prerequisiteId)?.push(target);
  });

  const queue = targets
    .filter((target) => (incoming.get(target.id) ?? 0) === 0)
    .sort((a, b) => compareTargets(a, b, originalIndex));

  const ordered: T[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.id)) continue;

    seen.add(current.id);
    ordered.push(current);

    for (const dependent of dependents.get(current.id) ?? []) {
      const nextIncoming = (incoming.get(dependent.id) ?? 0) - 1;
      incoming.set(dependent.id, nextIncoming);

      if (nextIncoming === 0) {
        queue.push(dependent);
        queue.sort((a, b) => compareTargets(a, b, originalIndex));
      }
    }
  }

  const remaining = targets
    .filter((target) => !seen.has(target.id))
    .sort((a, b) => compareTargets(a, b, originalIndex));

  return [...ordered, ...remaining];
}
