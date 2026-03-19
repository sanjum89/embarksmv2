import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@/types/learning";
import { currentUser, availableUsers as defaultAvailableUsers } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";

interface UserContextType {
  user: User;
  setRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
}

const fallbackUserContext: UserContextType = {
  user: currentUser,
  setRole: () => undefined,
  switchUser: () => undefined,
  availableUsers: defaultAvailableUsers,
};

const UserContext = createContext<UserContextType>(fallbackUserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const { activeAccount, loading } = useAccount();

  const getUsers = () => {
    if (activeAccount?.data?.employees?.length) {
      return activeAccount.data.employees.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        avatarUrl: e.avatarUrl,
        title: e.title,
        canManage: e.canManage,
      }));
    }
    return defaultAvailableUsers;
  };

  const users = getUsers();
  const [user, setUser] = useState<User>(users[0] || currentUser);

  // Reset user when account switches
  useEffect(() => {
    if (!loading) {
      const newUsers = getUsers();
      setUser(newUsers[0] || currentUser);
    }
  }, [activeAccount?.id, loading]);

  const setRole = (role: UserRole) => {
    setUser((prev) => ({ ...prev, role }));
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) setUser(found);
  };

  return (
    <UserContext.Provider value={{ user, setRole, switchUser, availableUsers: users }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
