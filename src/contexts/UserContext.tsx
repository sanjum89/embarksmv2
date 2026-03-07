import { createContext, useContext, useState, type ReactNode } from "react";
import type { User, UserRole } from "@/types/learning";
import { currentUser, availableUsers } from "@/data/mock";

interface UserContextType {
  user: User;
  setRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(currentUser);

  const setRole = (role: UserRole) => {
    setUser((prev) => ({ ...prev, role }));
  };

  const switchUser = (userId: string) => {
    const found = availableUsers.find((u) => u.id === userId);
    if (found) setUser(found);
  };

  return (
    <UserContext.Provider value={{ user, setRole, switchUser, availableUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
