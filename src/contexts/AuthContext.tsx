import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  authUser: User | null;
  authLoading: boolean;
  isSuperAdmin: boolean;
  allowedAccountIds: string[] | null; // null = all accounts visible
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  authLoading: true,
  isSuperAdmin: false,
  allowedAccountIds: null,
  signIn: async () => ({ error: "Not initialized" }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("signedInUsers_") || k.startsWith("lastActiveUser_") || k === "activeAccountId")
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  const meta = authUser?.app_metadata ?? {};
  const isSuperAdmin = meta.role === "superadmin";
  const allowedAccountIds: string[] | null = isSuperAdmin
    ? null
    : Array.isArray(meta.account_ids) && meta.account_ids.length > 0
      ? meta.account_ids
      : null;

  return (
    <AuthContext.Provider value={{ authUser, authLoading, isSuperAdmin, allowedAccountIds, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
