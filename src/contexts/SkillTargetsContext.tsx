import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { SkillTarget } from "@/types/learning";
import { mockSkillTargets } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";

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
      const cloned = JSON.parse(JSON.stringify(base)) as SkillTarget[];
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

  const skillTargets = perUserTargets[compositeKey] ?? getBaseTargets();

  const addSkillTargets = useCallback((targets: SkillTarget[]) => {
    setPerUserTargets((prev) => ({
      ...prev,
      [compositeKey]: [...(prev[compositeKey] ?? []), ...targets],
    }));
  }, [compositeKey]);

  const updateSkillTarget = useCallback((id: string, updater: (target: SkillTarget) => SkillTarget) => {
    setPerUserTargets((prev) => ({
      ...prev,
      [compositeKey]: (prev[compositeKey] ?? []).map((st) => (st.id === id ? updater(st) : st)),
    }));
  }, [compositeKey]);

  return (
    <SkillTargetsContext.Provider value={{ skillTargets, addSkillTargets, updateSkillTarget }}>
      {children}
    </SkillTargetsContext.Provider>
  );
}

export const useSkillTargets = () => useContext(SkillTargetsContext);
