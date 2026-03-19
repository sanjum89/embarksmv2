import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Account, AccountData } from "@/types/account";
import { supabase } from "@/integrations/supabase/client";
import { buildDefaultAccount, generateFallbackData } from "@/lib/accountDefaults";

interface AccountContextType {
  accounts: Account[];
  activeAccountId: string | null;
  activeAccount: Account | null;
  loading: boolean;
  switchAccount: (id: string) => void;
  addAccount: (name: string, data: Partial<AccountData> & { logo?: string; accent_color?: string; use_case_context?: string }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  loading: true,
  switchAccount: () => {},
  addAccount: async () => {},
  deleteAccount: async () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    () => localStorage.getItem("activeAccountId")
  );
  const [loading, setLoading] = useState(true);

  // Load accounts from DB
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load accounts:", error);
      setLoading(false);
      return;
    }

    let accts = (data as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      logo: row.logo,
      accent_color: row.accent_color,
      use_case_context: row.use_case_context,
      is_default: row.is_default,
      data: row.data as AccountData,
      created_at: row.created_at,
    })) as Account[];

    // Seed default account if none exists
    if (accts.length === 0) {
      const defaultAcct = buildDefaultAccount();
      const { data: inserted, error: insertError } = await supabase
        .from("accounts")
        .insert({
          name: defaultAcct.name,
          logo: defaultAcct.logo,
          accent_color: defaultAcct.accent_color,
          use_case_context: defaultAcct.use_case_context,
          is_default: defaultAcct.is_default,
          data: defaultAcct.data as any,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to seed default account:", insertError);
        setLoading(false);
        return;
      }

      accts = [{
        id: (inserted as any).id,
        name: (inserted as any).name,
        logo: (inserted as any).logo,
        accent_color: (inserted as any).accent_color,
        use_case_context: (inserted as any).use_case_context,
        is_default: (inserted as any).is_default,
        data: (inserted as any).data as AccountData,
        created_at: (inserted as any).created_at,
      }];
    }

    setAccounts(accts);

    // Set active account
    const savedId = localStorage.getItem("activeAccountId");
    if (savedId && accts.some((a) => a.id === savedId)) {
      setActiveAccountId(savedId);
    } else {
      const defaultAcct = accts.find((a) => a.is_default) ?? accts[0];
      setActiveAccountId(defaultAcct.id);
      localStorage.setItem("activeAccountId", defaultAcct.id);
    }

    setLoading(false);
  };

  const switchAccount = useCallback((id: string) => {
    setActiveAccountId(id);
    localStorage.setItem("activeAccountId", id);
  }, []);

  const addAccount = useCallback(async (
    name: string,
    rawData: Partial<AccountData> & { logo?: string; accent_color?: string; use_case_context?: string }
  ) => {
    const { logo, accent_color, use_case_context, ...partialData } = rawData;
    const fullData = generateFallbackData(partialData);

    const { data: inserted, error } = await supabase
      .from("accounts")
      .insert({
        name,
        logo: logo ?? null,
        accent_color: accent_color ?? null,
        use_case_context: use_case_context ?? null,
        is_default: false,
        data: fullData as any,
      })
      .select()
      .single();

    if (error) throw error;

    const newAcct: Account = {
      id: (inserted as any).id,
      name: (inserted as any).name,
      logo: (inserted as any).logo,
      accent_color: (inserted as any).accent_color,
      use_case_context: (inserted as any).use_case_context,
      is_default: false,
      data: (inserted as any).data as AccountData,
      created_at: (inserted as any).created_at,
    };

    setAccounts((prev) => [...prev, newAcct]);
    switchAccount(newAcct.id);
  }, [switchAccount]);

  const deleteAccount = useCallback(async (id: string) => {
    const acct = accounts.find((a) => a.id === id);
    if (!acct || acct.is_default) return;

    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;

    setAccounts((prev) => prev.filter((a) => a.id !== id));

    if (activeAccountId === id) {
      const defaultAcct = accounts.find((a) => a.is_default) ?? accounts[0];
      switchAccount(defaultAcct.id);
    }
  }, [accounts, activeAccountId, switchAccount]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? null;

  return (
    <AccountContext.Provider value={{
      accounts,
      activeAccountId,
      activeAccount,
      loading,
      switchAccount,
      addAccount,
      deleteAccount,
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
