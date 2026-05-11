import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChapterStatus = "not_started" | "in_progress" | "completed" | "locked";
export type ModuleStatus = "completed" | "in_progress" | "up_next" | "locked";

export interface JourneyChapter {
  code: string;
  title: string;
  contentType: string;
  minutes: number;
  status: ChapterStatus;
  displayOrder: number;
}

export interface JourneyModule {
  code: string;
  title: string;
  summary?: string;
  trackCode: string;
  isCoreRequired: boolean;
  isStretch: boolean;
  prerequisiteCodes: string[];
  prerequisiteTitle?: string;
  chapters: JourneyChapter[];
  completedChapters: number;
  totalChapters: number;
  pct: number;
  status: ModuleStatus;
  displayOrder: number;
}

export interface JourneyTrack {
  code: string;
  name: string;
  displayOrder: number;
  modules: JourneyModule[];
  completedChapters: number;
  totalChapters: number;
  completedModules: number;
  totalModules: number;
  pct: number;
}

export interface JourneyCohort {
  id: string;
  code: string;
  title: string;
  roleCohortCode: string;
  dueDate?: string | null;
  startDate?: string | null;
  completedModules: number;
  totalModules: number;
  completedChapters: number;
  totalChapters: number;
  overallPct: number;
}

export interface LearnerJourney {
  cohort: JourneyCohort;
  tracks: JourneyTrack[];
}

interface State {
  journey: LearnerJourney | null;
  isLoading: boolean;
  error: string | null;
}

export function useLearnerJourney(
  accountId: string | null | undefined,
  employeeId: string | null | undefined
): State {
  const [state, setState] = useState<State>({ journey: null, isLoading: false, error: null });

  // Stable key so we don't refetch on object identity churn
  const key = `${accountId ?? ""}::${employeeId ?? ""}`;

  useEffect(() => {
    if (!accountId || !employeeId) {
      setState({ journey: null, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    (async () => {
      try {
        // 1. Active enrollment for this employee
        const { data: enrollments, error: enErr } = await supabase
          .from("cohort_enrollments")
          .select("cohort_id, status")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("status", "active")
          .limit(1);
        if (enErr) throw enErr;
        const cohortId = enrollments?.[0]?.cohort_id;
        if (!cohortId) {
          if (!cancelled) setState({ journey: null, isLoading: false, error: null });
          return;
        }

        // 2. Cohort row
        const { data: cohortRow, error: cohortErr } = await supabase
          .from("cohorts")
          .select("id, cohort_code, cohort_title, role_cohort_code, due_date, start_date")
          .eq("id", cohortId)
          .maybeSingle();
        if (cohortErr) throw cohortErr;
        if (!cohortRow) {
          if (!cancelled) setState({ journey: null, isLoading: false, error: null });
          return;
        }

        // 3. Tracks for the account
        const { data: tracks, error: tErr } = await supabase
          .from("learning_tracks")
          .select("code, name, display_order")
          .eq("account_id", accountId)
          .order("display_order", { ascending: true });
        if (tErr) throw tErr;

        // 4. Modules for this cohort's role
        const { data: modules, error: mErr } = await supabase
          .from("catalog_modules")
          .select(
            "module_code, module_title, module_summary, learning_track_code, is_core_required, is_stretch_module, prerequisite_module_codes, display_order"
          )
          .eq("account_id", accountId)
          .eq("role_cohort_code", cohortRow.role_cohort_code)
          .order("display_order", { ascending: true });
        if (mErr) throw mErr;

        const moduleCodes = (modules ?? []).map((m) => m.module_code);

        // 5. Chapters for those modules
        const { data: chapters, error: chErr } = moduleCodes.length
          ? await supabase
              .from("catalog_chapters")
              .select(
                "chapter_code, module_code, chapter_title, content_type, estimated_time_minutes, display_order"
              )
              .eq("account_id", accountId)
              .in("module_code", moduleCodes)
              .order("display_order", { ascending: true })
          : { data: [], error: null };
        if (chErr) throw chErr;

        // 6. Learner progress
        const { data: progress, error: prErr } = await supabase
          .from("learner_progress")
          .select("module_code, chapter_code, status")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("cohort_id", cohortId);
        if (prErr) throw prErr;

        // 7. Open lock events (unlocked_at IS NULL = still locked)
        const { data: lockEvents, error: lkErr } = await supabase
          .from("chapter_lock_events")
          .select("module_code, chapter_code, unlocked_at")
          .eq("account_id", accountId)
          .eq("employee_id", employeeId)
          .eq("cohort_id", cohortId)
          .is("unlocked_at", null);
        if (lkErr) throw lkErr;

        const progressMap = new Map<string, string>();
        (progress ?? []).forEach((p) => {
          const k = `${p.module_code}::${p.chapter_code ?? ""}`;
          progressMap.set(k, p.status);
        });
        const lockSet = new Set<string>();
        (lockEvents ?? []).forEach((l) =>
          lockSet.add(`${l.module_code}::${l.chapter_code ?? ""}`)
        );

        // Group chapters by module
        const chaptersByModule = new Map<string, JourneyChapter[]>();
        (chapters ?? []).forEach((c) => {
          const key = `${c.module_code}::${c.chapter_code}`;
          const rawStatus = (progressMap.get(key) ?? "not_started") as ChapterStatus;
          const status: ChapterStatus = lockSet.has(key) ? "locked" : rawStatus;
          const list = chaptersByModule.get(c.module_code) ?? [];
          list.push({
            code: c.chapter_code,
            title: c.chapter_title,
            contentType: c.content_type ?? "reading",
            minutes: c.estimated_time_minutes ?? 0,
            status,
            displayOrder: c.display_order ?? 0,
          });
          chaptersByModule.set(c.module_code, list);
        });

        // Build modules
        const moduleByCode = new Map<string, JourneyModule>();
        (modules ?? []).forEach((m) => {
          const chs = (chaptersByModule.get(m.module_code) ?? []).sort(
            (a, b) => a.displayOrder - b.displayOrder
          );
          const completedChapters = chs.filter((c) => c.status === "completed").length;
          const totalChapters = chs.length;
          const pct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

          // Module-level lock = entire module marker (chapter_code = "" / null)
          const moduleLockKey = `${m.module_code}::`;
          const moduleLocked =
            lockSet.has(moduleLockKey) || (chs.length > 0 && chs.every((c) => c.status === "locked"));

          let status: ModuleStatus;
          if (totalChapters > 0 && completedChapters === totalChapters) status = "completed";
          else if (chs.some((c) => c.status === "in_progress")) status = "in_progress";
          else if (completedChapters > 0) status = "in_progress";
          else if (moduleLocked) status = "locked";
          else status = "up_next";

          moduleByCode.set(m.module_code, {
            code: m.module_code,
            title: m.module_title,
            summary: m.module_summary ?? undefined,
            trackCode: m.learning_track_code,
            isCoreRequired: m.is_core_required ?? true,
            isStretch: m.is_stretch_module ?? false,
            prerequisiteCodes: m.prerequisite_module_codes ?? [],
            chapters: chs,
            completedChapters,
            totalChapters,
            pct,
            status,
            displayOrder: m.display_order ?? 0,
          });
        });

        // Resolve prerequisite titles + auto-lock if prereq isn't completed
        moduleByCode.forEach((mod) => {
          if (mod.prerequisiteCodes.length > 0) {
            const firstUnmet = mod.prerequisiteCodes
              .map((c) => moduleByCode.get(c))
              .find((m) => m && m.status !== "completed");
            if (firstUnmet) {
              mod.prerequisiteTitle = firstUnmet.title;
              if (mod.status === "up_next") mod.status = "locked";
            }
          }
        });

        // Build tracks
        const trackList: JourneyTrack[] = (tracks ?? []).map((t) => {
          const mods = Array.from(moduleByCode.values())
            .filter((m) => m.trackCode === t.code)
            .sort((a, b) => {
              // core first, then stretch; preserve display order
              if (a.isStretch !== b.isStretch) return a.isStretch ? 1 : -1;
              return a.displayOrder - b.displayOrder;
            });
          const completedChapters = mods.reduce((s, m) => s + m.completedChapters, 0);
          const totalChapters = mods.reduce((s, m) => s + m.totalChapters, 0);
          const completedModules = mods.filter((m) => m.status === "completed").length;
          return {
            code: t.code,
            name: t.name,
            displayOrder: t.display_order ?? 0,
            modules: mods,
            completedChapters,
            totalChapters,
            completedModules,
            totalModules: mods.length,
            pct: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
          };
        });

        // Cohort totals
        const totalChapters = trackList.reduce((s, t) => s + t.totalChapters, 0);
        const completedChapters = trackList.reduce((s, t) => s + t.completedChapters, 0);
        const totalModules = trackList.reduce((s, t) => s + t.totalModules, 0);
        const completedModules = trackList.reduce((s, t) => s + t.completedModules, 0);

        const journey: LearnerJourney = {
          cohort: {
            id: cohortRow.id,
            code: cohortRow.cohort_code,
            title: cohortRow.cohort_title,
            roleCohortCode: cohortRow.role_cohort_code,
            dueDate: cohortRow.due_date,
            startDate: cohortRow.start_date,
            completedModules,
            totalModules,
            completedChapters,
            totalChapters,
            overallPct:
              totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
          },
          tracks: trackList,
        };

        if (!cancelled) setState({ journey, isLoading: false, error: null });
      } catch (e: any) {
        if (!cancelled)
          setState({ journey: null, isLoading: false, error: e?.message ?? "Failed to load journey" });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useMemo(() => state, [state]);
}
