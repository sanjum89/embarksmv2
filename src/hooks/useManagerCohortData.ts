import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import {
  COHORT_MODULES_FALLBACK,
  RATHBONES_COHORT_ID,
  RATHBONES_PERSONA_IDS,
  bucketStageLabel,
  getDemoOverlay,
  materializeOverlay,
  type LearnerOverlay,
} from "@/data/managerDemoOverlay";
import { loadEmployeeSignals, overlayFromSignals } from "@/lib/managerSignals";

export interface CohortBasic {
  id: string;
  cohort_code: string;
  cohort_title: string;
  role_cohort_code: string;
  start_date?: string;
  due_date?: string;
}

export interface CohortLearner {
  employeeId: string;
  name: string;
  title?: string;
  overlay: LearnerOverlay | null;
}

export interface CohortModuleCol {
  module_code: string;
  module_title: string;
  progression_stage?: string | null;
}

export interface ManagerCohortData {
  loading: boolean;
  cohort: CohortBasic | null;
  learners: CohortLearner[];
  modules: CohortModuleCol[];
}

const empty: ManagerCohortData = { loading: true, cohort: null, learners: [], modules: [] };

/**
 * Returns a manager-scoped view of a single cohort.
 * - Live: cohort row + cohort_modules from catalog + enrollment list.
 * - Overlay: for the 9 Rathbones personas, synthesizes their cohort row presence
 *   so the demo always shows a full roster even if live enrollments are sparse.
 */
export function useManagerCohortData(cohortId: string | null): ManagerCohortData {
  const { activeAccount } = useAccount();
  const [data, setData] = useState<ManagerCohortData>(empty);

  useEffect(() => {
    let cancelled = false;
    const accountId = (activeAccount as any)?.id as string | undefined;
    if (!cohortId || !accountId) {
      setData({ ...empty, loading: false });
      return;
    }

    (async () => {
      setData((d) => ({ ...d, loading: true }));

      const [cohortRes, modsRes, enrollRes] = await Promise.all([
        supabase
          .from("cohorts")
          .select("id,cohort_code,cohort_title,role_cohort_code,start_date,due_date")
          .eq("id", cohortId)
          .maybeSingle(),
        supabase
          .from("catalog_modules")
          .select("module_code,module_title,progression_stage,display_order,role_cohort_code")
          .eq("account_id", accountId)
          .order("display_order"),
        supabase
          .from("cohort_enrollments")
          .select("employee_id")
          .eq("account_id", accountId)
          .eq("cohort_id", cohortId),
      ]);

      const cohort = (cohortRes as any).data as CohortBasic | null;

      const allMods = (((modsRes as any).data ?? []) as any[]).filter(
        (m) => !cohort?.role_cohort_code || m.role_cohort_code === cohort.role_cohort_code
      );
      const liveModules: CohortModuleCol[] = allMods.length
        ? allMods.map((m) => ({
            module_code: m.module_code,
            module_title: m.module_title,
            // Override the upstream `progression_stage` (which is just the role
            // slug echoed back) with a meaningful decade-bucket label so the
            // Sankey draws several stage bands instead of one giant block.
            progression_stage: bucketStageLabel(m.display_order),
          }))
        : COHORT_MODULES_FALLBACK;

      // Live enrollments
      const liveIds = new Set<string>(((enrollRes as any).data ?? []).map((r: any) => r.employee_id));

      // Demo-overlay union for Rathbones cohort
      const isRathbonesCohort = cohortId === RATHBONES_COHORT_ID;
      const ids = new Set<string>(liveIds);
      if (isRathbonesCohort) RATHBONES_PERSONA_IDS.forEach((id) => ids.add(id));

      // Pull display names from the account directory
      const employees = (((activeAccount as any)?.data?.employees ?? []) as any[]).reduce<Record<string, any>>(
        (acc, e) => ({ ...acc, [e.id]: e }),
        {}
      );

      // For each enrolled employee, prefer real DB signals when present;
      // fall back to the hand-authored demo overlay for personas with no rows.
      // Pre-fetch chapter counts per module so we know what "completed module"
      // means at this point in time.
      const chsRes = await supabase
        .from("catalog_chapters")
        .select("module_code")
        .eq("account_id", accountId);
      const chaptersByModule: Record<string, number> = {};
      for (const c of (((chsRes as any).data ?? []) as any[])) {
        chaptersByModule[c.module_code] = (chaptersByModule[c.module_code] ?? 0) + 1;
      }

      const learners: CohortLearner[] = await Promise.all(
        Array.from(ids).map(async (id) => {
          let overlay: LearnerOverlay | null = null;
          try {
            const bundle = await loadEmployeeSignals(accountId, cohortId, id, liveModules);
            overlay = overlayFromSignals(id, bundle, liveModules, chaptersByModule);
          } catch {
            overlay = null;
          }
          if (!overlay) {
            const base = getDemoOverlay(id);
            overlay = base ? materializeOverlay(base, liveModules) : null;
          }
          return {
            employeeId: id,
            name: employees[id]?.name ?? id,
            title: employees[id]?.title,
            overlay,
          };
        })
      );

      // Order: rising stars first, then at-risk, then on track
      const rank = (s?: string) =>
        s === "at_risk" ? 0 : s === "needs_check_in" ? 1 : s === "on_track" ? 2 : s === "rising_star" ? 3 : 4;
      learners.sort((a, b) => rank(a.overlay?.status) - rank(b.overlay?.status) || a.name.localeCompare(b.name));

      if (cancelled) return;
      setData({ loading: false, cohort, learners, modules: liveModules });
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, cohortId]);

  return data;
}

/** Lightweight selector to enumerate all cohorts for the account. */
export function useAccountCohorts(): { loading: boolean; cohorts: CohortBasic[] } {
  const { activeAccount } = useAccount();
  const [state, setState] = useState<{ loading: boolean; cohorts: CohortBasic[] }>({ loading: true, cohorts: [] });
  useEffect(() => {
    const accountId = (activeAccount as any)?.id as string | undefined;
    if (!accountId) {
      setState({ loading: false, cohorts: [] });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("cohorts")
        .select("id,cohort_code,cohort_title,role_cohort_code,start_date,due_date,is_legacy_skill_target_wrapper,status")
        .eq("account_id", accountId);
      const cohorts = ((data ?? []) as any[])
        .filter((c) => !c.is_legacy_skill_target_wrapper && c.status !== "archived")
        .map((c) => ({
          id: c.id,
          cohort_code: c.cohort_code,
          cohort_title: c.cohort_title,
          role_cohort_code: c.role_cohort_code,
          start_date: c.start_date,
          due_date: c.due_date,
        }));
      setState({ loading: false, cohorts });
    })();
  }, [activeAccount]);
  return state;
}
