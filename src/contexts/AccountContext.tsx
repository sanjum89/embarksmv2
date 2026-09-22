import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { Account, AccountData } from "@/types/account";
import type { NormalizedAccount } from "@/types/account-v2";
import { supabase } from "@/integrations/supabase/client";
import { buildDefaultAccount, generateFallbackData, buildDefaultNormalized, buildPinnacleNormalized, buildRathbonesNormalized, buildUBSNormalized } from "@/lib/accountDefaults";
import { seedDemoNotifications, bootstrapInitialNotifications } from "@/data/agentOneSeeds";
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
  switching: boolean;
  switchAccount: (id: string) => void;
  addAccount: (name: string, data: Partial<AccountData> & { logo?: string; accent_color?: string; use_case_context?: string }, selectedUsers?: import("@/types/account-v2").AccountUser[]) => Promise<string>;
  deleteAccount: (id: string) => Promise<void>;
  updateAccount: (id: string, fields: { logo?: string | null; accent_color?: string | null; logo_superlight?: string | null }) => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  normalizedAccount: null,
  loading: true,
  switching: false,
  switchAccount: () => {},
  addAccount: async () => "",
  deleteAccount: async () => {},
  updateAccount: async () => {},
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
      // Auto-generate profileData when missing so every uploaded employee can open My360 safely
      if (Object.keys(parsed.profileData).length === 0 && Object.values(parsed.employeesById).length > 0) {
        parsed.profileData = generateProfileData(parsed);
      } else if (Object.values(parsed.employeesById).length > 0) {
        // Override profileData for employees with source-tagged skills (structured data takes precedence over stale static entries)
        const generated = generateProfileData(parsed);
        for (const [empId, genProfile] of Object.entries(generated)) {
          const emp = parsed.employeesById[empId];
          if (emp?.skills?.some((s) => s.source)) {
            // Only override skill arrays, preserve existing metadata (snapshots, location, etc.)
            const skillFields = ['roleSkillsCurrent', 'roleSkillsRequired', 'projectSkillsCurrent', 'projectSkillsRequired', 'otherSkills'] as const;
            const skillOverrides: any = {};
            for (const key of skillFields) {
              if ((genProfile as any)[key]) skillOverrides[key] = (genProfile as any)[key];
            }
            parsed.profileData[empId] = { ...parsed.profileData[empId], ...skillOverrides };
          }
        }
      }
      // Auto-derive reflections from employee data when none provided
      if (!parsed.reflections?.length) {
        const sourceEmployees = parsed.namedEmployees.length > 0 ? parsed.namedEmployees : Object.values(parsed.employeesById);
        if (sourceEmployees.length > 0) {
          parsed.reflections = deriveReflections(sourceEmployees);
        }
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
    cohortsById: {},
    cohortAssignments: [],
    employeeEntityOverrides: [],
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
  const [switching, setSwitching] = useState(false);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether accounts have been successfully loaded for the current session.
  // Prevents SIGNED_IN events (token refresh, tab focus) from re-running loadAccounts.
  const accountsLoadedRef = useRef(false);

  useEffect(() => {
    loadAccounts();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        accountsLoadedRef.current = false;
        loadAccounts();
      } else if (event === "SIGNED_IN" && !accountsLoadedRef.current) {
        // Only fires on first login from unauthenticated state, not on token refresh/tab focus
        loadAccounts();
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the active account's logo to localStorage so the login page can show it
  // before AccountContext is populated (i.e. before the user authenticates).
  useEffect(() => {
    if (!activeAccountId || accounts.length === 0) return;
    const acct = accounts.find((a) => a.id === activeAccountId);
    const logo = acct?.logo ?? "";
    try {
      if (logo) {
        localStorage.setItem("activeBrandLogo", logo);
      } else {
        localStorage.removeItem("activeBrandLogo");
      }
    } catch {}
  }, [activeAccountId, accounts]);


  const loadAccounts = async () => {
    setLoading(true);

    // Determine which accounts this auth user is allowed to see
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAccounts([]);
      setActiveAccountId(null);
      setLoading(false);
      return;
    }
    const appMeta = session.user.app_metadata ?? {};
    const isSuperAdmin = appMeta.role === "superadmin";
    const allowedIds: string[] | null = isSuperAdmin
      ? null
      : Array.isArray(appMeta.account_ids) && appMeta.account_ids.length > 0
        ? appMeta.account_ids
        : [];

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
      logo_superlight: row.logo_superlight,
      accent_color: row.accent_color,
      use_case_context: row.use_case_context,
      is_default: row.is_default,
      data: row.data as AccountData,
      created_at: row.created_at,
      workforce_groups_enabled: row.workforce_groups_enabled ?? false,
    })) as Account[];

    if (accts.length === 0 && isSuperAdmin) {
      const defaultAcct = buildDefaultAccount();
      const { data: existing } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_default", true)
        .limit(1);

      if (existing && existing.length > 0) {
        accts = (existing as any[]).map((row) => ({
          id: row.id, name: row.name, logo: row.logo, logo_superlight: row.logo_superlight,
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
          logo_superlight: (inserted as any).logo_superlight,
          accent_color: (inserted as any).accent_color, use_case_context: (inserted as any).use_case_context,
          is_default: (inserted as any).is_default, data: (inserted as any).data as AccountData,
          created_at: (inserted as any).created_at,
        }];
      }
    }

    // Seed UBS account if missing — canonical UUID so DevTools mirror button can reference it.
    const UBS_CANONICAL_ID = "7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e";
    const hasUBS = accts.some((a) => a.id === UBS_CANONICAL_ID || a.name === "UBS");
    if (!hasUBS) {
      const { data: ubsInserted, error: ubsError } = await supabase
        .from("accounts")
        .upsert({
          id: UBS_CANONICAL_ID,
          name: "UBS",
          logo: "/ubs-logo.png",
          logo_superlight: "/ubs-logo.png",
          accent_color: JSON.stringify({ primary: "0 0% 12%", accent: "0 100% 46%", sidebar: "0 0% 7%" }),
          use_case_context: "UBS is a leading global wealth manager. This demo shows a UBS Wealth Management Associate Investment Manager onboarding journey.",
          is_default: false,
          data: {} as any,
        }, { onConflict: "id", ignoreDuplicates: true })
        .select()
        .single();

      if (!ubsError && ubsInserted) {
        const ubsAcct: Account = {
          id: (ubsInserted as any).id,
          name: "UBS",
          logo: "/ubs-logo.png",
          logo_superlight: "/ubs-logo.png",
          accent_color: JSON.stringify({ primary: "0 0% 12%", accent: "0 100% 46%", sidebar: "0 0% 7%" }),
          use_case_context: null,
          is_default: false,
          data: {} as AccountData,
          created_at: (ubsInserted as any).created_at,
        };
        accts.push(ubsAcct);
      }
    }

    // Seed Pinnacle Capital account if missing — always use the canonical UUID so
    // mirror-account-content and other edge functions can reference it by a known ID.
    const PINNACLE_CANONICAL_ID = "08b9c4d5-f4ec-44bb-8bc2-099d9848f465";
    const hasPinnacle = accts.some((a) => a.name === "Pinnacle Capital");
    if (!hasPinnacle) {
      const { data: pinnacleInserted, error: pinnacleError } = await supabase
        .from("accounts")
        .upsert({
          id: PINNACLE_CANONICAL_ID,
          name: "Pinnacle Capital",
          logo: null,
          accent_color: null,
          use_case_context: null,
          is_default: false,
          data: {} as any,
        }, { onConflict: "id", ignoreDuplicates: true })
        .select()
        .single();

      if (!pinnacleError && pinnacleInserted) {
        const pAcct: Account = {
          id: (pinnacleInserted as any).id,
          name: "Pinnacle Capital",
          logo: null,
          logo_superlight: null,
          accent_color: null,
          use_case_context: null,
          is_default: false,
          data: {} as AccountData,
          created_at: (pinnacleInserted as any).created_at,
        };
        accts.push(pAcct);
      }
    }

    // Keep a full copy for cache-building — UBS and Pinnacle need Rathbones present to clone from,
    // even when Rathbones is filtered out of the visible account list.
    const allAccts = [...accts];

    // Filter the *visible* account list to what this auth user is allowed to see
    if (allowedIds !== null && allowedIds.length > 0) {
      accts = accts.filter((a) => allowedIds.includes(a.id));
    } else if (allowedIds !== null && allowedIds.length === 0) {
      accts = [];
    }

    // Build normalized cache from the full list so cloning always has a source
    const cache: Record<string, NormalizedAccount> = {};
    // First pass: normalize default + Rathbones (Pinnacle/UBS clone from Rathbones)
    for (const acct of allAccts) {
      if (acct.is_default) {
        cache[acct.id] = normalizeFromLegacy(acct);
      } else if (acct.name === "Rathbones") {
        const rb = buildRathbonesNormalized(acct.id);
        // Apply DB-stored branding overrides
        rb.branding.logo = acct.logo || rb.branding.logo;
        rb.branding.accentColor = acct.accent_color || rb.branding.accentColor;
        cache[acct.id] = rb;
      } else if (acct.name !== "Pinnacle Capital" && acct.name !== "UBS") {
        cache[acct.id] = normalizeFromLegacy(acct);
      }
    }
    // Second pass: build Pinnacle by cloning the Rathbones normalized data
    for (const acct of allAccts) {
      if (acct.name === "Pinnacle Capital") {
        // Find the Rathbones account to clone from
        const rathbonesEntry = Object.values(cache).find((n) => n.branding.name === "Rathbones");
        if (rathbonesEntry) {
          cache[acct.id] = {
            ...JSON.parse(JSON.stringify(rathbonesEntry)),
            id: acct.id,
            isDefault: false,
            branding: {
              ...rathbonesEntry.branding,
              name: "Pinnacle Capital",
              logo: acct.logo || rathbonesEntry.branding.logo,
              accentColor: acct.accent_color || rathbonesEntry.branding.accentColor,
            },
            contentNameMap: {
              "Rathbones": "Pinnacle Capital",
              "rathbones": "pinnacle capital",
              "RATHBONES": "PINNACLE CAPITAL",
            },
          };
        } else {
          // Fallback to default if Rathbones not found
          cache[acct.id] = buildPinnacleNormalized(acct.id);
        }
      }
    }
    // Third pass: build UBS by cloning the Rathbones normalized data with UBS branding
    for (const acct of allAccts) {
      if (acct.name === "UBS") {
        const rathbonesEntry = Object.values(cache).find((n) => n.branding.name === "Rathbones");
        if (rathbonesEntry) {
          cache[acct.id] = {
            ...JSON.parse(JSON.stringify(rathbonesEntry)),
            id: acct.id,
            isDefault: false,
            branding: {
              ...rathbonesEntry.branding,
              name: "UBS",
              logo: acct.logo || "/ubs-logo.png",
              accentColor: acct.accent_color || JSON.stringify({ primary: "0 0% 12%", accent: "0 100% 46%", sidebar: "0 0% 7%" }),
            },
            contentNameMap: {
              "Rathbones": "UBS",
              "rathbones": "UBS",
              "RATHBONES": "UBS",
              "Pinnacle Capital": "UBS",
              "Pinnacle": "UBS",
            },
          };
        } else {
          cache[acct.id] = buildUBSNormalized(acct.id);
        }
      }
    }

    setNormalizedCache(cache);
    setAccounts(accts);

    // Bootstrap initial-state notifications for all accounts, then seed demo extras.
    // Guard with a per-session flag so dev HMR / remounts don't refire the network storm.
    const bootstrappedFlag = "_agentOneBootstrapped";
    const globalFlag = (window as any)[bootstrappedFlag] || new Set<string>();
    (window as any)[bootstrappedFlag] = globalFlag;
    for (const acct of accts) {
      if (globalFlag.has(acct.id)) continue;
      const norm = cache[acct.id];
      if (norm) {
        globalFlag.add(acct.id);
        bootstrapInitialNotifications(acct.id, norm).catch((err) =>
          console.error("[AgentOne] Bootstrap error:", err)
        );
        if (norm.demoMode) {
          seedDemoNotifications(acct.id, norm).catch((err) =>
            console.error("[AgentOne] Seed error:", err)
          );
        }
      }
    }

    if (accts.length === 0) {
      setActiveAccountId(null);
    } else {
      const savedId = localStorage.getItem("activeAccountId");
      if (savedId && accts.some((a) => a.id === savedId)) {
        setActiveAccountId(savedId);
      } else {
        const defaultAcct = accts.find((a) => a.is_default) ?? accts[0];
        setActiveAccountId(defaultAcct.id);
        localStorage.setItem("activeAccountId", defaultAcct.id);
      }
    }

    // Mark as loaded — prevents SIGNED_IN events (token refresh, tab focus) from re-triggering
    accountsLoadedRef.current = true;
    setLoading(false);
  };

  const switchAccount = useCallback((id: string) => {
    if (id === activeAccountId) return;
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    setSwitching(true);
    switchTimerRef.current = setTimeout(() => {
      setActiveAccountId(id);
      localStorage.setItem("activeAccountId", id);
      setSwitching(false);
      switchTimerRef.current = null;
    }, 250);
  }, [activeAccountId]);

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
      logo_superlight: (inserted as any).logo_superlight,
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

  const updateAccount = useCallback(async (id: string, fields: { logo?: string | null; accent_color?: string | null; logo_superlight?: string | null }) => {
    const { error } = await supabase.from("accounts").update(fields).eq("id", id);
    if (error) throw error;

    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...fields } as Account : a))
    );
    // Update normalized cache
    setNormalizedCache((prev) => {
      const acct = accounts.find((a) => a.id === id);
      if (!acct) return prev;
      const updated = { ...acct, ...fields } as Account;
      return { ...prev, [id]: normalizeFromLegacy(updated) };
    });
  }, [accounts]);

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
      switching,
      switchAccount,
      addAccount,
      deleteAccount,
      updateAccount,
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
