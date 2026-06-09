import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";

export type WorkforceGroupKind = "office" | "function" | "team" | "initiative" | "custom";

export interface WorkforceGroup {
  id: string;
  account_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  kind: WorkforceGroupKind;
  description: string | null;
  sort_order: number;
}

export interface WorkforceGroupMember {
  id: string;
  group_id: string;
  employee_id: string;
}

export type WorkforceGroupLinkType = "role" | "cohort" | "compliance_rule" | "requisition" | "succession_slate";

export interface WorkforceGroupLink {
  id: string;
  group_id: string;
  entity_type: WorkforceGroupLinkType;
  entity_id: string;
  metadata: Record<string, any>;
}

export interface ComplianceRule {
  id: string;
  code: string;
  label: string;
  framework: "SMCR" | "CONSUMER_DUTY" | "CISI_CPD" | "TC" | "CUSTOM";
  target_hours: number | null;
  cadence: string | null;
}

interface WorkforceGroupContextValue {
  enabled: boolean;
  loading: boolean;
  groups: WorkforceGroup[];
  members: WorkforceGroupMember[];
  links: WorkforceGroupLink[];
  rules: ComplianceRule[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  selectedGroupPath: WorkforceGroup[];
  selectedSubtreeIds: string[];
  selectedSubtreeEmployeeIds: string[];
  toggleEnabled: (next: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const WorkforceGroupContext = createContext<WorkforceGroupContextValue>({
  enabled: false,
  loading: false,
  groups: [],
  members: [],
  links: [],
  rules: [],
  selectedGroupId: null,
  setSelectedGroupId: () => {},
  selectedGroupPath: [],
  selectedSubtreeIds: [],
  selectedSubtreeEmployeeIds: [],
  toggleEnabled: async () => {},
  refresh: async () => {},
});

function selectionKey(accountId: string) {
  return `workforceGroupSelection:${accountId}`;
}

export function WorkforceGroupProvider({ children }: { children: ReactNode }) {
  const { activeAccountId, activeAccount } = useAccount();
  const [enabledOverride, setEnabledOverride] = useState<boolean | null>(null);
  const enabled = enabledOverride ?? Boolean((activeAccount as any)?.workforce_groups_enabled);

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<WorkforceGroup[]>([]);
  const [members, setMembers] = useState<WorkforceGroupMember[]>([]);
  const [links, setLinks] = useState<WorkforceGroupLink[]>([]);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(() => {
    if (!activeAccountId) return null;
    try { return localStorage.getItem(selectionKey(activeAccountId)); } catch { return null; }
  });

  const refresh = useCallback(async () => {
    if (!activeAccountId || !enabled) {
      setGroups([]); setMembers([]); setLinks([]); setRules([]);
      return;
    }
    setLoading(true);
    const [g, m, l, r] = await Promise.all([
      supabase.from("workforce_groups").select("*").eq("account_id", activeAccountId).order("sort_order"),
      supabase.from("workforce_group_members").select("*").eq("account_id", activeAccountId),
      supabase.from("workforce_group_links").select("*").eq("account_id", activeAccountId),
      supabase.from("workforce_group_compliance_rules").select("*").eq("account_id", activeAccountId),
    ]);
    setGroups((g.data as any) ?? []);
    setMembers((m.data as any) ?? []);
    setLinks((l.data as any) ?? []);
    setRules((r.data as any) ?? []);
    setLoading(false);
  }, [activeAccountId, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  // Reset selection when account changes
  useEffect(() => {
    if (!activeAccountId) { setSelectedGroupIdState(null); return; }
    try {
      const stored = localStorage.getItem(selectionKey(activeAccountId));
      setSelectedGroupIdState(stored);
    } catch { setSelectedGroupIdState(null); }
    setEnabledOverride(null);
  }, [activeAccountId]);

  // Clear selection when feature turns off
  useEffect(() => {
    if (!enabled && selectedGroupId) {
      setSelectedGroupIdState(null);
      if (activeAccountId) {
        try { localStorage.removeItem(selectionKey(activeAccountId)); } catch {}
      }
    }
  }, [enabled, selectedGroupId, activeAccountId]);

  const setSelectedGroupId = useCallback((id: string | null) => {
    setSelectedGroupIdState(id);
    if (!activeAccountId) return;
    try {
      if (id) localStorage.setItem(selectionKey(activeAccountId), id);
      else localStorage.removeItem(selectionKey(activeAccountId));
    } catch {}
  }, [activeAccountId]);

  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const g of groups) {
      const p = g.parent_id ?? "__root__";
      (map[p] ??= []).push(g.id);
    }
    return map;
  }, [groups]);

  const groupsById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  const selectedSubtreeIds = useMemo(() => {
    if (!selectedGroupId) return [];
    const out: string[] = [];
    const walk = (id: string) => {
      out.push(id);
      for (const c of childrenMap[id] ?? []) walk(c);
    };
    if (groupsById[selectedGroupId]) walk(selectedGroupId);
    return out;
  }, [selectedGroupId, childrenMap, groupsById]);

  const selectedSubtreeEmployeeIds = useMemo(() => {
    if (selectedSubtreeIds.length === 0) return [];
    const set = new Set<string>();
    const subtree = new Set(selectedSubtreeIds);
    for (const m of members) if (subtree.has(m.group_id)) set.add(m.employee_id);
    return Array.from(set);
  }, [selectedSubtreeIds, members]);

  const selectedGroupPath = useMemo(() => {
    if (!selectedGroupId) return [];
    const path: WorkforceGroup[] = [];
    let cur: WorkforceGroup | undefined = groupsById[selectedGroupId];
    while (cur) {
      path.unshift(cur);
      cur = cur.parent_id ? groupsById[cur.parent_id] : undefined;
    }
    return path;
  }, [selectedGroupId, groupsById]);

  const toggleEnabled = useCallback(async (next: boolean) => {
    if (!activeAccountId) throw new Error("No active account");
    const { error } = await supabase.from("accounts").update({ workforce_groups_enabled: next } as any).eq("id", activeAccountId);
    if (error) throw error;
    setEnabledOverride(next);
    if (!next) {
      try { localStorage.removeItem(selectionKey(activeAccountId)); } catch {}
      setSelectedGroupIdState(null);
    }
  }, [activeAccountId]);

  const value: WorkforceGroupContextValue = {
    enabled,
    loading,
    groups,
    members,
    links,
    rules,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroupPath,
    selectedSubtreeIds,
    selectedSubtreeEmployeeIds,
    toggleEnabled,
    refresh,
  };

  return <WorkforceGroupContext.Provider value={value}>{children}</WorkforceGroupContext.Provider>;
}

export function useWorkforceGroups() {
  return useContext(WorkforceGroupContext);
}
