import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import {
  COHORT_MODULES_FALLBACK,
  RATHBONES_PERSONA_IDS,
  bucketStageLabel,
  getDemoOverlay,
  materializeOverlay,
  type LearnerOverlay,
} from "@/data/managerDemoOverlay";
import type { CohortModuleCol } from "@/hooks/useManagerCohortData";
import { loadEmployeeSignals, overlayFromSignals } from "@/lib/managerSignals";
import { usePrimaryCohortId } from "@/hooks/usePrimaryCohortId";

export interface PersonaOverlaysState {
  loading: boolean;
  overlays: LearnerOverlay[];
  byId: Record<string, LearnerOverlay>;
  modules: CohortModuleCol[];
}

const empty: PersonaOverlaysState = { loading: true, overlays: [], byId: {}, modules: [] };

/**
 * Loads DB-backed overlays for the Rathbones cohort personas (union with any
 * live enrollments). Mirrors the per-employee loop in `useManagerCohortData`
 * so manager/admin surfaces outside the cohort drill-down stay in sync with
 * the seeded DB state. Falls back to the hand-authored overlay only when no
 * DB rows exist for a given employee.
 *
 * Account-agnostic: works for Rathbones and the Pinnacle Capital white-label
 * (same cohort_id, same persona IDs) because the DB query filters by
 * activeAccount.id.
 */
export function useRathbonesPersonaOverlays(
  cohortIdArg?: string,
): PersonaOverlaysState {
  const primaryCohortId = usePrimaryCohortId();
  const cohortId = cohortIdArg ?? primaryCohortId;
  const { activeAccount } = useAccount();
  const [state, setState] = useState<PersonaOverlaysState>(empty);

  useEffect(() => {
    let cancelled = false;
    const accountId = (activeAccount as any)?.id as string | undefined;
    if (!accountId) {
      setState({ ...empty, loading: false });
      return;
    }

    (async () => {
      setState((s) => ({ ...s, loading: true }));

      const [cohortRes, modsRes, enrollRes, chsRes] = await Promise.all([
        supabase
          .from("cohorts")
          .select("id,role_cohort_code")
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
        supabase
          .from("catalog_chapters")
          .select("module_code")
          .eq("account_id", accountId),
      ]);

      const cohort = (cohortRes as any).data as { role_cohort_code?: string } | null;
      const allMods = (((modsRes as any).data ?? []) as any[]).filter(
        (m) => !cohort?.role_cohort_code || m.role_cohort_code === cohort.role_cohort_code,
      );
      const liveModules: CohortModuleCol[] = allMods.length
        ? allMods.map((m) => ({
            module_code: m.module_code,
            module_title: m.module_title,
            progression_stage: bucketStageLabel(m.display_order),
          }))
        : COHORT_MODULES_FALLBACK;

      const chaptersByModule: Record<string, number> = {};
      for (const c of (((chsRes as any).data ?? []) as any[])) {
        chaptersByModule[c.module_code] = (chaptersByModule[c.module_code] ?? 0) + 1;
      }

      const liveIds = new Set<string>(((enrollRes as any).data ?? []).map((r: any) => r.employee_id));
      const ids = new Set<string>(liveIds);
      if (cohortId === primaryCohortId) {
        RATHBONES_PERSONA_IDS.forEach((id) => ids.add(id));
      }

      const entries = await Promise.all(
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
          return overlay;
        }),
      );

      const overlays = entries.filter((o): o is LearnerOverlay => !!o);
      const byId: Record<string, LearnerOverlay> = {};
      for (const o of overlays) byId[o.employeeId] = o;

      if (cancelled) return;
      setState({ loading: false, overlays, byId, modules: liveModules });
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, cohortId, primaryCohortId]);

  return state;
}
