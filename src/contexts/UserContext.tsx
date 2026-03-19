import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, UserRole } from "@/types/learning";
import { currentUser, availableUsers as defaultAvailableUsers } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import type { AccountUser } from "@/types/account-v2";

const STORAGE_KEY = "signedInUsers";

interface UserContextType {
  user: User;
  setRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  signedInUserIds: string[];
  loginUser: (userId: string) => boolean;
  logoutUser: (userId: string) => void;
}

function accountUserToUser(au: AccountUser): User {
  return {
    id: au.id,
    name: au.name,
    email: au.email,
    role: au.role,
    avatarUrl: au.avatarUrl,
    title: au.title,
    canManage: au.canManage,
  };
}

function readPersistedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function persistIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

const fallbackUserContext: UserContextType = {
  user: currentUser,
  setRole: () => undefined,
  switchUser: () => undefined,
  availableUsers: defaultAvailableUsers,
  signedInUserIds: [currentUser.id],
  loginUser: () => false,
  logoutUser: () => undefined,
};

const UserContext = createContext<UserContextType>(fallbackUserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const { normalizedAccount, activeAccount, loading } = useAccount();

  const getUsers = (): User[] => {
    if (normalizedAccount && Object.keys(normalizedAccount.usersById).length > 0) {
      return Object.values(normalizedAccount.usersById).map(accountUserToUser);
    }
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

  // Signed-in user IDs, persisted in localStorage
  const [signedInUserIds, setSignedInUserIds] = useState<string[]>(() => {
    const persisted = readPersistedIds();
    // Ensure at least the first user is signed in on first visit
    if (persisted.length === 0 && users.length > 0) {
      const initial = [users[0].id];
      persistIds(initial);
      return initial;
    }
    return persisted;
  });

  const [user, setUser] = useState<User>(() => {
    // Try to restore active user from signed-in set
    const signedIn = readPersistedIds();
    if (signedIn.length > 0) {
      const found = users.find((u) => u.id === signedIn[0]);
      if (found) return found;
    }
    return users[0] || currentUser;
  });

  // Reset user when account switches
  useEffect(() => {
    if (!loading) {
      const newUsers = getUsers();
      const newFirst = newUsers[0] || currentUser;
      setUser(newFirst);
      // Reset signed-in to first user of new account
      const newIds = [newFirst.id];
      setSignedInUserIds(newIds);
      persistIds(newIds);
    }
  }, [activeAccount?.id, normalizedAccount?.id, loading]);

  const setRole = (role: UserRole) => {
    setUser((prev) => ({ ...prev, role }));
  };

  const switchUser = useCallback((userId: string) => {
    // Only allow switching to signed-in users
    if (!signedInUserIds.includes(userId)) return;
    const found = users.find((u) => u.id === userId);
    if (found) setUser(found);
  }, [signedInUserIds, users]);

  const loginUser = useCallback((userId: string): boolean => {
    const found = users.find((u) => u.id === userId);
    if (!found) return false;
    const updated = [...new Set([...signedInUserIds, userId])];
    setSignedInUserIds(updated);
    persistIds(updated);
    setUser(found);
    return true;
  }, [signedInUserIds, users]);

  const logoutUser = useCallback((userId: string) => {
    const updated = signedInUserIds.filter((id) => id !== userId);
    setSignedInUserIds(updated);
    persistIds(updated);
    // If the logged-out user is the active user, switch to first remaining
    if (user.id === userId) {
      if (updated.length > 0) {
        const next = users.find((u) => u.id === updated[0]);
        if (next) setUser(next);
      }
      // If none left, user stays but will need to log in again
    }
  }, [signedInUserIds, user.id, users]);

  return (
    <UserContext.Provider value={{ user, setRole, switchUser, availableUsers: users, signedInUserIds, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
