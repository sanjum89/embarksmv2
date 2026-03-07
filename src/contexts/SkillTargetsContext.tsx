import { createContext, useContext, useState, ReactNode } from "react";
import type { SkillTarget } from "@/types/learning";
import { mockSkillTargets } from "@/data/mock";

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
  const [skillTargets, setSkillTargets] = useState<SkillTarget[]>(mockSkillTargets);

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
