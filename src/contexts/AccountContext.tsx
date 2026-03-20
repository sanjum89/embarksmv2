import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Account, AccountData } from "@/types/account";
import type { NormalizedAccount } from "@/types/account-v2";
import { supabase } from "@/integrations/supabase/client";
import { buildDefaultAccount, generateFallbackData, buildDefaultNormalized } from "@/lib/accountDefaults";
import { parseAccountJSON } from "@/lib/accountParser";
import { generateProfileData } from "@/lib/profileDataGenerator";
import { deriveReflections } from "@/lib/adminDataDerivation";

interface AccountContextType {
  accounts: Account[];
  activeAccountId: string | null;
  activeAccount: Account | null;
  /** Normalized view of the active account */
  normalizedAccount: NormalizedAccount | null;
  loading: boolean;
  switchAccount: (id: string) => void;
  addAccount: (name: string, data: Partial<AccountData> & { logo?: string; accent_color?: string; use_case_context?: string }, selectedUsers?: import("@/types/account-v2").AccountUser[]) => Promise<string>;
  deleteAccount: (id: string) => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  normalizedAccount: null,
  loading: true,
  switchAccount: () => {},
  addAccount: async () => "",
  deleteAccount: async () => {},
});

/**
 * Build a NormalizedAccount from a legacy Account row.
 */
function normalizeFromLegacy(acct: Account): NormalizedAccount {
  if (acct.is_default) {
    return buildDefaultNormalized(acct.id);
  }

  // For uploaded accounts, try v2 parsing from the data blob
  const data = acct.data as any;

  // Check if this is a v2-style JSON (has `users` or `employees` array + `account` or `name`)
  const hasV2Shape = data?.users || data?.employees;

  if (hasV2Shape) {
    const { account: parsed } = parseAccountJSON({ ...data, name: data.name || acct.name }, acct.id);
    if (parsed) {
      // Override branding from top-level account fields
      parsed.branding.logo = acct.logo || parsed.branding.logo;
      parsed.branding.accentColor = acct.accent_color || parsed.branding.accentColor;
      parsed.isDefault = acct.is_default;
      parsed.createdAt = acct.created_at;
      // Auto-generate profileData if missing but employees have skills
      if (Object.keys(parsed.profileData).length === 0 && Object.values(parsed.employeesById).some(e => e.skills?.length)) {
        parsed.profileData = generateProfileData(parsed);
      }
      return parsed;
    }
  }

  // Legacy v1 shape: flat AccountData blob
  const employees = data?.employees || [];
  const usersById: Record<string, any> = {};
  const employeesById: Record<string, any> = {};
  const hierarchyMap: Record<string, string[]> = {};

  for (const e of employees) {
    usersById[e.id] = {
      id: e.id,
      name: e.name,
      email: e.email || "",
      role: e.role || "learner",
      avatarUrl: e.avatarUrl,
      title: e.title,
      canManage: e.canManage ?? (e.role === "manager" || e.role === "admin"),
      linkedEmployeeId: e.id,
    };
    employeesById[e.id] = {
      id: e.id,
      name: e.name,
      email: e.email || "",
      title: e.title,
      reportsTo: e.reportsTo ?? null,
      avatarUrl: e.avatarUrl,
    };
    if (e.reportsTo) {
      if (!hierarchyMap[e.reportsTo]) hierarchyMap[e.reportsTo] = [];
      hierarchyMap[e.reportsTo].push(e.id);
    }
  }

  return {
    id: acct.id,
    schemaVersion: "1",
    isDefault: acct.is_default,
    createdAt: acct.created_at,
    branding: {
      name: acct.name,
      logo: acct.logo,
      accentColor: acct.accent_color,
    },
    proficiencyScale: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"],
    usersById,
    employeesById,
    rolesById: {},
    projectsById: {},
    projectAssignments: [],
    hierarchyMap,
    skillTargets: data?.skillTargets || [],
    rolePlays: data?.rolePlays || [],
    assessments: data?.assessments || [],
    learningModules: data?.learningModules || [],
    newHires: data?.newHires || [],
    programContexts: data?.programContexts || [],
    teamMembers: Object.values(usersById),
    profileData: data?.profileData || {},
    prompts: data?.prompts || {},
    aiContext: data?.aiManagerConfig || {},
    pageData: {},
    my360: {},
    reflections: [],
    workSignals: [],
    architectureSources: [],
    architectureSignalCounts: [],
    namedEmployees: [],
    peopleGraph: [],
    signals: [],
    showcaseCases: [],
    explainability: [],
    performanceAlerts: [],
    recommendedCTAs: [],
  };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [normalizedCache, setNormalizedCache] = useState<Record<string, NormalizedAccount>>({});
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    () => localStorage.getItem("activeAccountId")
  );
  const [loading, setLoading] = useState(true);

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

    if (accts.length === 0) {
      const defaultAcct = buildDefaultAccount();
      const { data: existing } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_default", true)
        .limit(1);

      if (existing && existing.length > 0) {
        accts = (existing as any[]).map((row) => ({
          id: row.id, name: row.name, logo: row.logo,
          accent_color: row.accent_color, use_case_context: row.use_case_context,
          is_default: row.is_default, data: row.data as AccountData, created_at: row.created_at,
        }));
      } else {
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
          id: (inserted as any).id, name: (inserted as any).name, logo: (inserted as any).logo,
          accent_color: (inserted as any).accent_color, use_case_context: (inserted as any).use_case_context,
          is_default: (inserted as any).is_default, data: (inserted as any).data as AccountData,
          created_at: (inserted as any).created_at,
        }];
      }
    }

    // Build normalized cache
    const cache: Record<string, NormalizedAccount> = {};
    for (const acct of accts) {
      cache[acct.id] = normalizeFromLegacy(acct);
    }
    setNormalizedCache(cache);
    setAccounts(accts);

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
    rawData: Partial<AccountData> & { logo?: string; accent_color?: string; use_case_context?: string },
    selectedUsers?: import("@/types/account-v2").AccountUser[]
  ): Promise<string> => {
    const { logo, accent_color, use_case_context, ...partialData } = rawData;
    const fullData = generateFallbackData(partialData);

    // If selectedUsers provided, embed them in the data blob so parser picks them up
    if (selectedUsers && selectedUsers.length > 0) {
      (fullData as any).users = selectedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        title: u.title,
        canManage: u.canManage,
        linkedEmployeeId: u.linkedEmployeeId || u.id,
      }));
    }

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

    const normalized = normalizeFromLegacy(newAcct);
    setNormalizedCache((prev) => ({ ...prev, [newAcct.id]: normalized }));
    setAccounts((prev) => [...prev, newAcct]);
    switchAccount(newAcct.id);
    return newAcct.id;
  }, [switchAccount]);

  const deleteAccount = useCallback(async (id: string) => {
    const acct = accounts.find((a) => a.id === id);
    if (!acct || acct.is_default) return;

    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setNormalizedCache((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (activeAccountId === id) {
      const defaultAcct = accounts.find((a) => a.is_default) ?? accounts[0];
      switchAccount(defaultAcct.id);
    }
  }, [accounts, activeAccountId, switchAccount]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? null;
  const normalizedAccount = activeAccountId ? normalizedCache[activeAccountId] ?? null : null;

  return (
    <AccountContext.Provider value={{
      accounts,
      activeAccountId,
      activeAccount,
      normalizedAccount,
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
