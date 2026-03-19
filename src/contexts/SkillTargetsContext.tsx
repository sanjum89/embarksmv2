import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { SkillTarget } from "@/types/learning";
import { mockSkillTargets } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";

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

export function SkillTargetsProvider({ children }: { children: ReactNode }) {
  const { activeAccount, loading } = useAccount();

  const getInitialTargets = () => {
    if (activeAccount?.data?.skillTargets?.length) {
      return activeAccount.data.skillTargets;
    }
    return mockSkillTargets;
  };

  const [skillTargets, setSkillTargets] = useState<SkillTarget[]>(getInitialTargets);

  useEffect(() => {
    if (!loading) {
      setSkillTargets(getInitialTargets());
    }
  }, [activeAccount?.id, loading]);

  const addSkillTargets = (targets: SkillTarget[]) => {
    setSkillTargets((prev) => [...prev, ...targets]);
  };

  const updateSkillTarget = (id: string, updater: (target: SkillTarget) => SkillTarget) => {
    setSkillTargets((prev) =>
      prev.map((st) => (st.id === id ? updater(st) : st))
    );
  };

  return (
    <SkillTargetsContext.Provider value={{ skillTargets, addSkillTargets, updateSkillTarget }}>
      {children}
    </SkillTargetsContext.Provider>
  );
}

export const useSkillTargets = () => useContext(SkillTargetsContext);
