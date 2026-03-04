import { createContext, useContext, useState, ReactNode } from "react";
import type { SkillTarget } from "@/types/learning";
import { mockSkillTargets } from "@/data/mock";

interface SkillTargetsContextType {
  skillTargets: SkillTarget[];
  addSkillTargets: (targets: SkillTarget[]) => void;
}

const SkillTargetsContext = createContext<SkillTargetsContextType>({
  skillTargets: mockSkillTargets,
  addSkillTargets: () => {},
});

export function SkillTargetsProvider({ children }: { children: ReactNode }) {
  const [skillTargets, setSkillTargets] = useState<SkillTarget[]>(mockSkillTargets);

  const addSkillTargets = (targets: SkillTarget[]) => {
    setSkillTargets((prev) => [...prev, ...targets]);
  };

  return (
    <SkillTargetsContext.Provider value={{ skillTargets, addSkillTargets }}>
      {children}
    </SkillTargetsContext.Provider>
  );
}

export const useSkillTargets = () => useContext(SkillTargetsContext);
