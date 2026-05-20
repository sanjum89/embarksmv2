import { useMemo, useState, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useRathbonesPersonaOverlays } from "@/hooks/useRathbonesPersonaOverlays";
import { useManagerActions } from "@/store/useManagerActions";
import { learnerSeedsFor } from "@/data/learnerActionSeeds";
import type { ActionFeedItem, ActionPriority, CategoryFilter } from "@/lib/actionCentre/itemKinds";
import { matchesFilter, PRIORITY_RANK } from "@/lib/actionCentre/itemKinds";
import type { ActionItem } from "@/data/managerDemoOverlay";

type LocalState = Record<string, "snoozed" | "done" | "dismissed" | undefined>;

const SEVERITY_TO_PRIORITY: Record<string, ActionPriority> = {
  high: "now",
  medium: "today",
  low: "this_week",
};

function managerActionToFeedItem(a: ActionItem & { learnerName: string }): ActionFeedItem {
  const isHand = a.group === "raised_hand";
  const isReflection = a.group === "reflection_review";
  const kind = isHand ? "raised_hand" : isReflection ? "reflection_review" : "approval_request";
  return {
    id: a.id,
    kind,
    priority: SEVERITY_TO_PRIORITY[a.severity] ?? "this_week",
    category: kind === "raised_hand" ? "mention" : "approval",
    title: `${a.learnerName} · ${a.title}`,
    detail: a.detail,
    actor: a.learnerName,
    when: a.age,
    source: a,
  };
}

export interface ActionCentreFeed {
  buckets: Record<ActionPriority, ActionFeedItem[]>;
  ai: ActionFeedItem[];
  totalOpen: number;
  countByBucket: Record<ActionPriority, number>;
  snooze: (id: string) => void;
  markDone: (id: string) => void;
  dismiss: (id: string) => void;
  undo: (id: string) => void;
  state: LocalState;
  setFilter: (f: CategoryFilter) => void;
  filter: CategoryFilter;
}

export function useActionCentreFeed(): ActionCentreFeed {
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const { overlays } = useRathbonesPersonaOverlays();
  const { approvals } = useManagerActions();
  const employeesById = normalizedAccount?.employeesById ?? {};

  const [state, setState] = useState<LocalState>({});
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const isManager = user.role === "manager" || user.role === "admin" || user.canManage;

  const learnerItems = useMemo<ActionFeedItem[]>(() => {
    // user.id is the employeeId in this app
    return learnerSeedsFor(user.id);
  }, [user.id]);

  const managerItems = useMemo<ActionFeedItem[]>(() => {
    if (!isManager) return [];
    return overlays.flatMap((o) =>
      o.actions
        .filter((a) => {
          const d = approvals[a.id]?.decision;
          return d !== "approved" && d !== "rejected" && d !== "resolved";
        })
        .map((a) => managerActionToFeedItem({ ...a, learnerName: employeesById[o.employeeId]?.name || o.employeeId }))
    );
  }, [overlays, approvals, employeesById, isManager]);

  const allItems = useMemo(() => {
    const merged = [...learnerItems, ...managerItems];
    return merged.filter((i) => {
      const s = state[i.id];
      return s !== "done" && s !== "dismissed" && s !== "snoozed";
    });
  }, [learnerItems, managerItems, state]);

  const filtered = useMemo(() => allItems.filter((i) => matchesFilter(i, filter)), [allItems, filter]);

  const aiItems = useMemo(() => filtered.filter((i) => i.ai), [filtered]);
  const triageItems = useMemo(() => filtered.filter((i) => !i.ai), [filtered]);

  const buckets = useMemo(() => {
    const out: Record<ActionPriority, ActionFeedItem[]> = { now: [], today: [], this_week: [], later: [] };
    for (const i of triageItems) {
      out[i.priority].push(i);
    }
    (Object.keys(out) as ActionPriority[]).forEach((k) =>
      out[k].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    );
    return out;
  }, [triageItems]);

  const countByBucket = useMemo(
    () => ({
      now: buckets.now.length,
      today: buckets.today.length,
      this_week: buckets.this_week.length,
      later: buckets.later.length,
    }),
    [buckets]
  );

  const snooze = useCallback((id: string) => setState((s) => ({ ...s, [id]: "snoozed" })), []);
  const markDone = useCallback((id: string) => setState((s) => ({ ...s, [id]: "done" })), []);
  const dismiss = useCallback((id: string) => setState((s) => ({ ...s, [id]: "dismissed" })), []);
  const undo = useCallback((id: string) => setState((s) => ({ ...s, [id]: undefined })), []);

  return {
    buckets,
    ai: aiItems,
    totalOpen: triageItems.length,
    countByBucket,
    snooze,
    markDone,
    dismiss,
    undo,
    state,
    setFilter,
    filter,
  };
}
