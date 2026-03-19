import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, UserRole } from "@/types/learning";
import { currentUser, availableUsers as defaultAvailableUsers } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import type { AccountUser } from "@/types/account-v2";

function storageKey(accountId: string) {
  return `signedInUsers_${accountId}`;
}

interface UserContextType {
  user: User;
  setRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  signedInUserIds: string[];
  loginUser: (userId: string) => boolean;
  logoutUser: (userId: string) => void;
  setInitialSignedInUsers: (accountId: string, userIds: string[]) => void;
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

function readPersistedIds(accountId: string | null): string[] {
  if (!accountId) return [];
  try {
    const raw = localStorage.getItem(storageKey(accountId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function persistIds(accountId: string | null, ids: string[]) {
  if (!accountId) return;
  localStorage.setItem(storageKey(accountId), JSON.stringify(ids));
}

const fallbackUserContext: UserContextType = {
  user: currentUser,
  setRole: () => undefined,
  switchUser: () => undefined,
  availableUsers: defaultAvailableUsers,
  signedInUserIds: [currentUser.id],
  loginUser: () => false,
  logoutUser: () => undefined,
  setInitialSignedInUsers: () => undefined,
};

const UserContext = createContext<UserContextType>(fallbackUserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const { normalizedAccount, activeAccount, loading } = useAccount();
  const activeAccountId = activeAccount?.id ?? null;

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

  // Signed-in user IDs, persisted per-account in localStorage
  const [signedInUserIds, setSignedInUserIds] = useState<string[]>(() => {
    const persisted = readPersistedIds(activeAccountId);
    if (persisted.length === 0 && users.length > 0) {
      const initial = [users[0].id];
      persistIds(activeAccountId, initial);
      return initial;
    }
    return persisted;
  });

  const [user, setUser] = useState<User>(() => {
    const signedIn = readPersistedIds(activeAccountId);
    if (signedIn.length > 0) {
      const found = users.find((u) => u.id === signedIn[0]);
      if (found) return found;
    }
    return users[0] || currentUser;
  });

  // Reset user when account switches
  useEffect(() => {
    if (!loading && activeAccountId) {
      const newUsers = getUsers();
      const persisted = readPersistedIds(activeAccountId);

      if (persisted.length > 0) {
        // Use persisted signed-in set for this account
        const validIds = persisted.filter((id) => newUsers.some((u) => u.id === id));
        if (validIds.length > 0) {
          setSignedInUserIds(validIds);
          persistIds(activeAccountId, validIds);
          const activeUser = newUsers.find((u) => u.id === validIds[0]);
          if (activeUser) setUser(activeUser);
          return;
        }
      }

      // Fallback: sign in the first user
      const newFirst = newUsers[0] || currentUser;
      setUser(newFirst);
      const newIds = newUsers.length > 0 ? [newFirst.id] : [];
      setSignedInUserIds(newIds);
      persistIds(activeAccountId, newIds);
    }
  }, [activeAccountId, loading]);

  const setRole = (role: UserRole) => {
    setUser((prev) => ({ ...prev, role }));
  };

  const switchUser = useCallback((userId: string) => {
    if (!signedInUserIds.includes(userId)) return;
    const found = users.find((u) => u.id === userId);
    if (found) setUser(found);
  }, [signedInUserIds, users]);

  const loginUser = useCallback((userId: string): boolean => {
    const found = users.find((u) => u.id === userId);
    if (!found) return false;
    const updated = [...new Set([...signedInUserIds, userId])];
    setSignedInUserIds(updated);
    persistIds(activeAccountId, updated);
    setUser(found);
    return true;
  }, [signedInUserIds, users, activeAccountId]);

  const logoutUser = useCallback((userId: string) => {
    setSignedInUserIds((prev) => {
      const updated = prev.filter((id) => id !== userId);
      persistIds(activeAccountId, updated);
      // If we're logging out the active user, switch to the next signed-in user
      if (user.id === userId && updated.length > 0) {
        const next = users.find((u) => u.id === updated[0]);
        if (next) setUser(next);
      }
      return updated;
    });
  }, [user.id, users, activeAccountId]);

  const setInitialSignedInUsers = useCallback((accountId: string, userIds: string[]) => {
    persistIds(accountId, userIds);
    // If this is the current account, update state immediately
    if (accountId === activeAccountId) {
      setSignedInUserIds(userIds);
      if (userIds.length > 0) {
        const found = users.find((u) => u.id === userIds[0]);
        if (found) setUser(found);
      }
    }
  }, [activeAccountId, users]);

  return (
    <UserContext.Provider value={{ user, setRole, switchUser, availableUsers: users, signedInUserIds, loginUser, logoutUser, setInitialSignedInUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
