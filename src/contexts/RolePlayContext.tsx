import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { RolePlay } from "@/types/learning";
import { mockRolePlayBank } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";

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
  const { normalizedAccount, activeAccount, loading } = useAccount();

  const getInitialPlays = () => {
    if (normalizedAccount?.rolePlays?.length) {
      return normalizedAccount.rolePlays;
    }
    if (activeAccount?.data?.rolePlays?.length) {
      return activeAccount.data.rolePlays;
    }
    return mockRolePlayBank;
  };

  const [rolePlays, setRolePlays] = useState<RolePlay[]>(getInitialPlays);

  useEffect(() => {
    if (!loading) {
      setRolePlays(getInitialPlays());
    }
  }, [activeAccount?.id, normalizedAccount?.id, loading]);

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
