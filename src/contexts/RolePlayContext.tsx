import { createContext, useContext, useState, type ReactNode } from "react";
import type { RolePlay } from "@/types/learning";
import { mockRolePlayBank } from "@/data/mock";

interface RolePlayContextType {
  rolePlays: RolePlay[];
  updateRolePlay: (id: string, updates: Partial<RolePlay>) => void;
  getRolePlay: (id: string) => RolePlay | undefined;
}

const RolePlayContext = createContext<RolePlayContextType>({
  rolePlays: mockRolePlayBank,
  updateRolePlay: () => undefined,
  getRolePlay: () => undefined,
});

export function RolePlayProvider({ children }: { children: ReactNode }) {
  const [rolePlays, setRolePlays] = useState<RolePlay[]>(mockRolePlayBank);

  const updateRolePlay = (id: string, updates: Partial<RolePlay>) => {
    setRolePlays((prev) =>
      prev.map((rp) => (rp.id === id ? { ...rp, ...updates } : rp))
    );
  };

  const getRolePlay = (id: string) => rolePlays.find((rp) => rp.id === id);

  return (
    <RolePlayContext.Provider value={{ rolePlays, updateRolePlay, getRolePlay }}>
      {children}
    </RolePlayContext.Provider>
  );
}

export function useRolePlays() {
  return useContext(RolePlayContext);
}
