import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
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

function employeeToFallbackUser(employee: AccountUser | AccountEmployee, hierarchyMap: Record<string, string[]>): User {
  const rawRole = String((employee as any).role || "").toLowerCase();
  const inferredRole: UserRole = rawRole === "admin" || rawRole === "manager" || rawRole === "learner"
    ? rawRole as UserRole
    : hierarchyMap[employee.id]?.length
      ? "manager"
      : "learner";

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: inferredRole,
    avatarUrl: employee.avatarUrl,
    title: employee.title,
    canManage: inferredRole !== "learner",
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
    if (normalizedAccount) {
      const explicitUsers = Object.values(normalizedAccount.usersById).map(accountUserToUser);
      const linkedIds = new Set(Object.values(normalizedAccount.usersById).map((user) => user.linkedEmployeeId || user.id));
      const fallbackUsers = Object.values(normalizedAccount.employeesById)
        .filter((employee) => !linkedIds.has(employee.id))
        .map((employee) => employeeToFallbackUser(employee, normalizedAccount.hierarchyMap));

      if (explicitUsers.length > 0 || fallbackUsers.length > 0) {
        return [...explicitUsers, ...fallbackUsers];
      }
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

  const activeAccountIdRef = useRef(activeAccountId);
  const usersRef = useRef(users);

  useEffect(() => { activeAccountIdRef.current = activeAccountId; }, [activeAccountId]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Signed-in user IDs, persisted per-account in localStorage
  const [signedInUserIds, setSignedInUserIds] = useState<string[]>(() => {
    return readPersistedIds(activeAccountId);
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

      // No persisted session — show login page
      setSignedInUserIds([]);
      persistIds(activeAccountId, []);
      setUser(newUsers[0] || currentUser);
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
    const currentAccountId = activeAccountIdRef.current;
    const currentUsers = usersRef.current;

    setSignedInUserIds((prev) => {
      const updated = prev.filter((id) => id !== userId);
      persistIds(currentAccountId, updated);

      if (user.id === userId && updated.length > 0) {
        const next = currentUsers.find((u) => u.id === updated[0]);
        if (next) setUser(next);
      }
      return updated;
    });
  }, [user.id]);

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
