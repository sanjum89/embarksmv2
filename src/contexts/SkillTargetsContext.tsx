import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import type { SkillTarget } from "@/types/learning";
import { mockSkillTargets, getPersonaSkillTargets } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { emitEvent } from "@/lib/agentOneEventEmitter";

interface SkillTargetsContextType {
  skillTargets: SkillTarget[];
  addSkillTargets: (targets: SkillTarget[]) => void;
  updateSkillTarget: (id: string, updater: (target: SkillTarget) => SkillTarget) => void;
}

const SkillTargetsContext = createContext<SkillTargetsContextType>({
  skillTargets: mockSkillTargets,
  addSkillTargets: () => {},
  updateSkillTarget: () => {},
});

/**
 * Per-user skill target state.
 * Each user gets their own independent copy of skill targets so that
 * progress / unlock state is fully isolated between profiles.
 */
export function SkillTargetsProvider({ children }: { children: ReactNode }) {
  const { normalizedAccount, activeAccount, loading } = useAccount();
  const { user } = useUser();

  const getBaseTargets = useCallback((): SkillTarget[] => {
    if (Array.isArray(normalizedAccount?.skillTargets) && normalizedAccount.skillTargets.length) {
      return normalizedAccount.skillTargets;
    }
    if (Array.isArray(activeAccount?.data?.skillTargets) && activeAccount.data.skillTargets.length) {
      return activeAccount.data.skillTargets;
    }
    return mockSkillTargets;
  }, [normalizedAccount, activeAccount]);

  // Map of userId → their own skill targets state
  const [perUserTargets, setPerUserTargets] = useState<Record<string, SkillTarget[]>>({});

  const accountId = activeAccount?.id ?? "__default";
  const userId = user.id;
  const compositeKey = `${accountId}::${userId}`;

  // When account or user list changes, seed any user that doesn't have state yet
  useEffect(() => {
    if (loading) return;
    setPerUserTargets((prev) => {
      if (prev[compositeKey]) return prev; // already seeded
      // Deep clone so each user gets independent objects
      const base = getBaseTargets();
      // Apply persona-specific skill target variants (e.g. Elliot's intro has different formats)
      const personalized = getPersonaSkillTargets(userId, base);
      const cloned = JSON.parse(JSON.stringify(personalized)) as SkillTarget[];
      return { ...prev, [compositeKey]: cloned };
    });
  }, [compositeKey, loading, getBaseTargets]);

  // Reset per-user map when account switches (different account = fresh slate)
  const accountIdRef = useState(accountId)[0];
  useEffect(() => {
    if (!loading && accountId !== accountIdRef) {
      // Account actually changed — handled by compositeKey seeding above
    }
  }, [accountId, loading]);

  // Auto-unlock targets when their prerequisite is completed
  useEffect(() => {
    if (loading) return;
    const targets = perUserTargets[compositeKey];
    if (!targets) return;

    let changed = false;
    const updated = targets.map(target => {
      if (!target.locked || !target.prerequisiteId) return target;
      const prereq = targets.find(t => t.id === target.prerequisiteId);
      if (!prereq) return target;
      const prereqDone = prereq.progress >= 100 || prereq.steps.every(s => s.status === "completed" || s.status === "skipped");
      if (prereqDone) {
        changed = true;
        const steps = target.steps.map((s, i) => i === 0 ? { ...s, status: "available" as const } : s);
        return { ...target, locked: false, steps };
      }
      return target;
    });

    if (changed) {
      setPerUserTargets(prev => ({ ...prev, [compositeKey]: updated }));
    }
  }, [perUserTargets, compositeKey, loading]);

  const skillTargets = perUserTargets[compositeKey] ?? getPersonaSkillTargets(userId, getBaseTargets());

  const addSkillTargets = useCallback((targets: SkillTarget[]) => {
    setPerUserTargets((prev) => ({
      ...prev,
      [compositeKey]: [...(prev[compositeKey] ?? []), ...targets],
    }));
  }, [compositeKey]);

  // Track which targets have already emitted midpoint events to avoid duplicates
  const midpointEmitted = useRef<Set<string>>(new Set());

  const updateSkillTarget = useCallback((id: string, updater: (target: SkillTarget) => SkillTarget) => {
    setPerUserTargets((prev) => {
      const currentTargets = prev[compositeKey] ?? [];
      const oldTarget = currentTargets.find((st) => st.id === id);
      const updated = currentTargets.map((st) => (st.id === id ? updater(st) : st));
      const newTarget = updated.find((st) => st.id === id);

      // Emit onboarding_midpoint_reached when progress crosses 50%
      if (
        oldTarget && newTarget &&
        oldTarget.progress < 50 && newTarget.progress >= 50 &&
        !midpointEmitted.current.has(`${compositeKey}::${id}`) &&
        normalizedAccount && activeAccount?.id
      ) {
        midpointEmitted.current.add(`${compositeKey}::${id}`);
        emitEvent({
          account_id: activeAccount.id,
          event_type: "onboarding_midpoint_reached",
          category: "onboarding_progress",
          source_employee_id: userId,
          target_employee_id: userId,
          related_employee_ids: [],
          related_skill_target_id: id,
          payload: { progress: newTarget.progress, skillTargetTitle: newTarget.title },
        }, normalizedAccount).catch(console.error);
      }

      return { ...prev, [compositeKey]: updated };
    });
  }, [compositeKey, normalizedAccount, activeAccount?.id, userId]);

  return (
    <SkillTargetsContext.Provider value={{ skillTargets, addSkillTargets, updateSkillTarget }}>
      {children}
    </SkillTargetsContext.Provider>
  );
}

export const useSkillTargets = () => useContext(SkillTargetsContext);
