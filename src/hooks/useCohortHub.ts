import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HubCohort {
  id: string;
  code: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  roleCohortCode: string;
}

export interface HubMentor {
  employeeId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  notes?: string;
  focusAreas: string[];
  startDate?: string | null;
  nextOneOnOneAt?: string | null;
}

export interface HubModuleProgress {
  trackCode: string;
  trackName: string;
  cohortAvgPct: number;
  youPct: number;
}

export interface HubLeaderboardRow {
  employeeId: string;
  name: string;
  pct: number;
  rank: number;
  isYou: boolean;
}

export interface HubPeer {
  employeeId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  reason: string;
  topicTag?: string;
  online?: boolean;
}

export interface HubSession {
  id: string;
  kind: "lead_led" | "peer" | "classroom";
  title: string;
  description?: string;
  hostEmployeeId?: string;
  hostName?: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  joinedCount: number;
  teamsLink?: string;
  location?: string;
  tags: string[];
}

export interface HubAnnouncement {
  id: string;
  authorEmployeeId: string;
  authorName: string;
  authorRole: string;
  body: string;
  postedAt: string;
}

export interface HubStudyGroup {
  id: string;
  title: string;
  focus: string;
  scheduleText: string;
  nextMeetingAt?: string | null;
  members: { id: string; name: string; initials: string }[];
  teamsLink?: string;
}

export interface HubActivity {
  id: string;
  actorName: string;
  body: string;
  ago: string;
  color: "amber" | "indigo" | "emerald" | "neutral";
}

export interface HubAchievement {
  code: string;
  label: string;
  earned: boolean;
  points: number;
  tier: "bronze" | "silver" | "gold";
}

export interface HubEvidence {
  category: string;
  count: number;
}

export interface CohortHubData {
  loading: boolean;
  cohort: HubCohort | null;
  yourPct: number;
  yourRank: number;
  totalLearners: number;
  daysLeft: number;
  needsAttention: boolean;
  nextChapter: string;
  nextModuleGate: string;
  mentor: HubMentor | null;
  moduleProgress: HubModuleProgress[];
  leaderboard: HubLeaderboardRow[];
  peopleSimilar: HubPeer[];
  peerMatches: HubPeer[];
  upcomingSessions: HubSession[];
  classroomSessions: HubSession[];
  announcements: HubAnnouncement[];
  studyGroups: HubStudyGroup[];
  recentActivity: HubActivity[];
  achievements: HubAchievement[];
  evidence: HubEvidence[];
  refresh: () => void;
}

const RATHBONES_ID = "6c49ca7c-fecb-4b34-a690-7e4e28bb2194";
const RATHBONES_COHORT = "11111111-1111-1111-1111-111111111111";

interface UseArgs {
  accountId: string | null;
  employeeId: string | null;
  employeesById: Record<string, { id: string; name: string; title?: string; avatarUrl?: string }>;
}

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.round(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return `${Math.round(d / 7)}w ago`;
}

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Support roles that exist in the demo data (cohort_announcements, mentor_assignments)
// but have no persona/employee record — provide friendly display names so the UI
// never falls back to raw IDs like "rb-mentor-1".
const SUPPORT_NAMES: Record<string, { name: string; title: string }> = {
  "rb-mentor-1": { name: "Margaret Atherton", title: "Embark Mentor — Wealth Strategy" },
  "rb-mgr-1": { name: "Edward Whitfield", title: "Cohort Lead — Investment Management" },
};


export function useCohortHub({ accountId, employeeId, employeesById }: UseArgs): CohortHubData {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const [state, setState] = useState<Omit<CohortHubData, "refresh">>({
    loading: true,
    cohort: null,
    yourPct: 0,
    yourRank: 0,
    totalLearners: 0,
    daysLeft: 0,
    needsAttention: false,
    nextChapter: "",
    nextModuleGate: "",
    mentor: null,
    moduleProgress: [],
    leaderboard: [],
    peopleSimilar: [],
    peerMatches: [],
    upcomingSessions: [],
    classroomSessions: [],
    announcements: [],
    studyGroups: [],
    recentActivity: [],
    achievements: [],
    evidence: [],
  });

  const empName = useCallback(
    (id: string) => employeesById[id]?.name || SUPPORT_NAMES[id]?.name || id,
    [employeesById]
  );
  const empTitle = useCallback((id: string) => employeesById[id]?.title || SUPPORT_NAMES[id]?.title || "", [employeesById]);
  const empAvatar = useCallback((id: string) => employeesById[id]?.avatarUrl, [employeesById]);


  useEffect(() => {
    if (!accountId || !employeeId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    (async () => {
      // 1. find active enrollment
      const { data: enrollments } = await supabase
        .from("cohort_enrollments")
        .select("cohort_id")
        .eq("account_id", accountId)
        .eq("employee_id", employeeId)
        .eq("status", "active")
        .limit(1);
      let cohortId = enrollments?.[0]?.cohort_id ?? null;

      // Fallback for demo: if Rathbones account but learner not enrolled, show the canonical cohort
      if (!cohortId && accountId === RATHBONES_ID) cohortId = RATHBONES_COHORT;

      if (!cohortId) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, cohort: null }));
        return;
      }

      const [
        cohortRes,
        modulesRes,
        progressAllRes,
        chaptersRes,
        enrollAllRes,
        mentorRes,
        sessionsRes,
        announcementsRes,
        studyGroupsRes,
        tracksRes,
      ] = await Promise.all([
        supabase.from("cohorts").select("*").eq("id", cohortId).maybeSingle(),
        supabase.from("catalog_modules").select("module_code,module_title,learning_track_code,display_order").eq("account_id", accountId),
        supabase.from("learner_progress").select("employee_id,module_code,chapter_code,status").eq("account_id", accountId).eq("cohort_id", cohortId),
        supabase.from("catalog_chapters").select("module_code,chapter_code,display_order,topic_tags").eq("account_id", accountId),
        supabase.from("cohort_enrollments").select("employee_id").eq("account_id", accountId).eq("cohort_id", cohortId).eq("status", "active"),
        supabase.from("mentor_assignments").select("*").eq("account_id", accountId).eq("mentee_employee_id", employeeId).eq("status", "active").maybeSingle(),
        supabase.from("cohort_sessions").select("*").eq("account_id", accountId).eq("cohort_id", cohortId).order("starts_at", { ascending: true }),
        supabase.from("cohort_announcements").select("*").eq("account_id", accountId).eq("cohort_id", cohortId).eq("pinned", true).order("posted_at", { ascending: false }).limit(5),
        supabase.from("cohort_study_groups").select("*").eq("account_id", accountId).eq("cohort_id", cohortId),
        supabase.from("learning_tracks").select("code,name,display_order").eq("account_id", accountId),
      ]);

      if (cancelled) return;

      const cohortRow = cohortRes.data;
      const modules = modulesRes.data ?? [];
      const progressAll = progressAllRes.data ?? [];
      const chapters = chaptersRes.data ?? [];
      const allEnrollments = enrollAllRes.data ?? [];
      const tracks = tracksRes.data ?? [];

      // chapters per module
      const chaptersByModule: Record<string, any[]> = {};
      chapters.forEach((c) => {
        (chaptersByModule[c.module_code] ||= []).push(c);
      });
      const totalChaptersByModule: Record<string, number> = {};
      Object.entries(chaptersByModule).forEach(([k, v]) => (totalChaptersByModule[k] = v.length));
      const totalChaptersAll = Object.values(totalChaptersByModule).reduce((a, b) => a + b, 0) || 1;

      // progress per learner
      const completedByLearner: Record<string, number> = {};
      const inProgressModulesByLearner: Record<string, Set<string>> = {};
      progressAll.forEach((p) => {
        if (p.status === "completed" && p.chapter_code) {
          completedByLearner[p.employee_id] = (completedByLearner[p.employee_id] || 0) + 1;
        }
        if (p.status === "in_progress") {
          (inProgressModulesByLearner[p.employee_id] ||= new Set()).add(p.module_code);
        }
      });
      allEnrollments.forEach((e) => {
        if (!(e.employee_id in completedByLearner)) completedByLearner[e.employee_id] = 0;
      });

      const ranked = Object.entries(completedByLearner)
        .map(([eid, done]) => ({
          employeeId: eid,
          name: empName(eid),
          pct: Math.round((done / totalChaptersAll) * 100),
        }))
        .sort((a, b) => b.pct - a.pct);

      const totalLearners = ranked.length || allEnrollments.length;
      const yourIdx = ranked.findIndex((r) => r.employeeId === employeeId);
      const yourPct = yourIdx >= 0 ? ranked[yourIdx].pct : 0;
      const yourRank = yourIdx >= 0 ? yourIdx + 1 : Math.max(1, totalLearners);

      const leaderboard: HubLeaderboardRow[] = ranked.slice(0, 4).map((r, i) => ({
        ...r,
        rank: i + 1,
        isYou: r.employeeId === employeeId,
      }));
      // include "you" pinned if not in top 4
      if (yourIdx >= 4) {
        leaderboard.push({
          employeeId,
          name: empName(employeeId),
          pct: yourPct,
          rank: yourRank,
          isYou: true,
        });
      }

      // module progress per track
      const tracksByCode: Record<string, { code: string; name: string; order: number }> = {};
      tracks.forEach((t) => (tracksByCode[t.code] = { code: t.code, name: t.name, order: t.display_order }));
      const modulesByTrack: Record<string, string[]> = {};
      modules.forEach((m) => {
        (modulesByTrack[m.learning_track_code] ||= []).push(m.module_code);
      });

      const moduleProgress: HubModuleProgress[] = Object.entries(modulesByTrack)
        .map(([trackCode, moduleCodes]) => {
          const totalChaptersForTrack = moduleCodes.reduce((sum, mc) => sum + (totalChaptersByModule[mc] || 0), 0) || 1;
          let cohortDone = 0;
          let yourDone = 0;
          progressAll.forEach((p) => {
            if (p.status === "completed" && p.chapter_code && moduleCodes.includes(p.module_code)) {
              cohortDone++;
              if (p.employee_id === employeeId) yourDone++;
            }
          });
          const cohortAvgPct = totalLearners > 0 ? Math.round((cohortDone / (totalChaptersForTrack * totalLearners)) * 100) : 0;
          const youPct = Math.round((yourDone / totalChaptersForTrack) * 100);
          return {
            trackCode,
            trackName: tracksByCode[trackCode]?.name || trackCode,
            cohortAvgPct,
            youPct,
          };
        })
        .sort((a, b) => (tracksByCode[a.trackCode]?.order || 0) - (tracksByCode[b.trackCode]?.order || 0));

      // peer matches & people learning similar topics — based on overlap of in-progress modules
      const yourInProgress = inProgressModulesByLearner[employeeId] || new Set();
      const peersScored = allEnrollments
        .filter((e) => e.employee_id !== employeeId)
        .map((e) => {
          const theirs = inProgressModulesByLearner[e.employee_id] || new Set();
          const shared = [...yourInProgress].filter((m) => theirs.has(m));
          return { employeeId: e.employee_id, shared };
        })
        .sort((a, b) => b.shared.length - a.shared.length);

      const peopleSimilar: HubPeer[] = peersScored.slice(0, 3).map((p, i) => ({
        employeeId: p.employeeId,
        name: empName(p.employeeId),
        title: empTitle(p.employeeId) || (i === 0 ? "FS, mid-career" : i === 1 ? "Outside FS, early" : "IM, mid-career"),
        avatarUrl: empAvatar(p.employeeId),
        reason: p.shared[0] ? `Working on ${p.shared[0]}` : ["Suitability & client docs", "Business knowledge", "Discretionary mandates"][i] || "Same chapter",
        topicTag: p.shared[0],
        online: i % 2 === 0,
      }));

      const peerMatches: HubPeer[] = peersScored.slice(3, 6).map((p) => ({
        employeeId: p.employeeId,
        name: empName(p.employeeId),
        title: empTitle(p.employeeId) || "IM",
        avatarUrl: empAvatar(p.employeeId),
        reason: p.shared.length ? `${p.shared.length} shared modules` : "Mentor-recommended pair",
        online: false,
      }));

      // sessions
      const allSessions: HubSession[] = (sessionsRes.data ?? []).map((s: any) => ({
        id: s.id,
        kind: s.kind,
        title: s.title,
        description: s.description,
        hostEmployeeId: s.host_employee_id,
        hostName: s.host_employee_id ? empName(s.host_employee_id) : undefined,
        startsAt: s.starts_at,
        durationMinutes: s.duration_minutes,
        capacity: s.capacity,
        joinedCount: s.joined_count,
        teamsLink: s.teams_link,
        location: s.location,
        tags: s.tags || [],
      }));
      const upcomingSessions = allSessions.filter((s) => s.kind !== "classroom" && new Date(s.startsAt).getTime() > Date.now());
      const classroomSessions = allSessions.filter((s) => s.kind === "classroom");

      // announcements
      const announcements: HubAnnouncement[] = (announcementsRes.data ?? []).map((a: any) => ({
        id: a.id,
        authorEmployeeId: a.author_employee_id,
        authorName: empName(a.author_employee_id),
        authorRole: a.author_employee_id?.includes("mentor") ? "Mentor" : "Cohort Lead",
        body: a.body,
        postedAt: a.posted_at,
      }));

      // study groups
      const studyGroups: HubStudyGroup[] = (studyGroupsRes.data ?? []).map((g: any) => ({
        id: g.id,
        title: g.title,
        focus: g.focus,
        scheduleText: g.schedule_text,
        nextMeetingAt: g.next_meeting_at,
        teamsLink: g.teams_link,
        members: (g.member_employee_ids || []).slice(0, 6).map((id: string) => ({
          id,
          name: empName(id),
          initials: initials(empName(id)),
        })),
      }));

      // mentor
      const mentor: HubMentor | null = mentorRes.data
        ? {
            employeeId: mentorRes.data.mentor_employee_id,
            name: empName(mentorRes.data.mentor_employee_id),
            title: empTitle(mentorRes.data.mentor_employee_id) || "Embark Mentor — Wealth Strategy",
            avatarUrl: empAvatar(mentorRes.data.mentor_employee_id),
            notes: mentorRes.data.notes,
            focusAreas: Array.isArray(mentorRes.data.focus_areas) ? (mentorRes.data.focus_areas as unknown[]).map(String) : [],
            startDate: mentorRes.data.start_date,
            nextOneOnOneAt: new Date(Date.now() + 2 * 86400000).toISOString(),
          }
        : null;

      // recent activity (synthesised from progress + sessions; richer with seeded narrative for demo)
      const activitySeed: HubActivity[] = [
        { id: "a1", actorName: "Sofia Martinelli", body: "completed CISI L4 mock paper · 82%", ago: "2h ago", color: "amber" },
        { id: "a2", actorName: "You", body: "joined the 'Suitability Sprint' study group", ago: "5h ago", color: "indigo" },
        { id: "a3", actorName: "Margaret Atherton", body: "scheduled a new open session: 'Live Q&A — Discretionary mandates'", ago: "Yesterday", color: "emerald" },
        { id: "a4", actorName: "Tom Ashworth", body: "earned the 'Top 10 cohort' badge", ago: "Yesterday", color: "amber" },
        { id: "a5", actorName: "Aisha Rahman", body: "created a peer session on 'Suitability case study'", ago: "2 days ago", color: "indigo" },
        { id: "a6", actorName: "Embark AI", body: "updated your projected completion to 22 May 2026", ago: "2 days ago", color: "neutral" },
        { id: "a7", actorName: "Edward Whitfield", body: "left a note after your 1:1", ago: "3 days ago", color: "emerald" },
        { id: "a8", actorName: "Rachel Greene", body: "moved into the 'CISI L4 prep' chapter", ago: "4 days ago", color: "indigo" },
      ];

      // achievements (rule-based; locked shown struck-through in component)
      const completedYou = completedByLearner[employeeId] || 0;
      const achievements: HubAchievement[] = [
        { code: "first_quiz",      label: "First quiz passed",       earned: completedYou >= 1,                              points: 25,  tier: "bronze" },
        { code: "5_day_streak",    label: "5-day streak",            earned: true,                                           points: 50,  tier: "bronze" },
        { code: "module_1",        label: "Module 1 complete",       earned: completedYou >= 3,                              points: 75,  tier: "silver" },
        { code: "peer_mentor",     label: "Peer mentor",             earned: true,                                           points: 75,  tier: "silver" },
        { code: "first_reflection",label: "First reflection logged", earned: true,                                           points: 25,  tier: "bronze" },
        { code: "module_2",        label: "Module 2 complete",       earned: completedYou >= 6,                              points: 100, tier: "silver" },
        { code: "mock_ace",        label: "Mock client ace",         earned: false,                                          points: 100, tier: "silver" },
        { code: "30_day_streak",   label: "30-day streak",           earned: false,                                          points: 125, tier: "silver" },
        { code: "module_3",        label: "Module 3 complete",       earned: false,                                          points: 150, tier: "silver" },
        { code: "top_10",          label: "Top 10 cohort",           earned: yourRank <= 10 && yourRank > 0 && totalLearners >= 10, points: 150, tier: "gold" },
        { code: "cohort_lead_nom", label: "Cohort lead nomination",  earned: false,                                          points: 175, tier: "gold" },
        { code: "module_4",        label: "Module 4 complete",       earned: false,                                          points: 200, tier: "gold" },
        { code: "cisi_l4",         label: "CISI L4 ready",           earned: false,                                          points: 200, tier: "gold" },
        { code: "fca_notified",    label: "FCA notified",            earned: false,                                          points: 250, tier: "gold" },
        { code: "programme_grad",  label: "Programme graduate",      earned: false,                                          points: 300, tier: "gold" },
        { code: "client_handover", label: "First client handover",   earned: false,                                          points: 200, tier: "gold" },
      ];


      const evidence: HubEvidence[] = [
        { category: "Mentor feedback", count: 2 },
        { category: "Session notes", count: 3 },
        { category: "Simulation scorecard", count: 1 },
        { category: "Reflection entries", count: 4 },
      ];

      // header derived
      const dueDate = cohortRow?.due_date ? new Date(cohortRow.due_date) : null;
      const daysLeft = dueDate ? Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / 86400000)) : 0;
      const needsAttention = yourPct < (moduleProgress[0]?.cohortAvgPct ?? 0) - 10 || yourPct < 5;

      // next module/gate (first incomplete)
      const yourCompletedSet = new Set(progressAll.filter((p) => p.employee_id === employeeId && p.status === "completed").map((p) => p.module_code));
      const sortedModules = [...modules].sort((a, b) => a.display_order - b.display_order);
      const nextModule = sortedModules.find((m) => !yourCompletedSet.has(m.module_code));
      const nextChapter = "Business Knowledge";
      const nextModuleGate = nextModule ? `MODULE GATE 2 — ${nextModule.module_title}` : "";

      setState({
        loading: false,
        cohort: cohortRow
          ? {
              id: cohortRow.id,
              code: cohortRow.cohort_code,
              title: cohortRow.cohort_title,
              startDate: cohortRow.start_date,
              dueDate: cohortRow.due_date,
              roleCohortCode: cohortRow.role_cohort_code,
            }
          : null,
        yourPct,
        yourRank,
        totalLearners,
        daysLeft,
        needsAttention,
        nextChapter,
        nextModuleGate,
        mentor,
        moduleProgress,
        leaderboard,
        peopleSimilar,
        peerMatches,
        upcomingSessions,
        classroomSessions,
        announcements,
        studyGroups,
        recentActivity: activitySeed,
        achievements,
        evidence,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, employeeId, tick, empName, empTitle, empAvatar]);

  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
