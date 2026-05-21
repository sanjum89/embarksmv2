import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useCohortHub, type HubSession, type HubStudyGroup, type HubPeer } from "@/hooks/useCohortHub";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JoinModal } from "@/components/cohort-hub/JoinModal";


import {
  Users, Calendar, ChevronRight, ChevronLeft, ChevronDown, Sparkles, Trophy, Award, MessageCircle,
  FileText, ArrowRight, AlertTriangle, CheckCircle2, Flag, BookOpen, Clock, Lock,
  Flame, Target, GraduationCap, ShieldCheck, Star, Handshake, Crown, Medal, Rocket, Briefcase, PencilLine,
  Pin, Trash2,
} from "lucide-react";

import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { deriveHubStatus, cohortAvgPct } from "@/lib/cohortHubStatus";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CoLearningTimeline } from "@/components/cohort/CoLearningTimeline";
import { PeopleToConnect } from "@/components/cohort/PeopleToConnect";
import { CohortRightRail } from "@/components/cohort/CohortRightRail";
import { AdaptedPathTab } from "@/components/cohort/AdaptedPathTab";
import { StaggerList, StaggerItem } from "@/components/motion/Motion";

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDayTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}



export default function CohortHub() {
  const { user } = useUser();
  const { activeAccount, normalizedAccount } = useAccount();
  const { substitute } = useContentSubstitution();
  const accountId = activeAccount?.id ?? null;
  const employeeId = user?.id ?? null;
  const employeesById = (normalizedAccount?.employeesById ?? {}) as any;
  const data = useCohortHub({ accountId, employeeId, employeesById });
  
  const [modal, setModal] = useState<null | { title: string; description?: string; meta?: any[]; teamsLink?: string; primaryLabel?: string }>(null);



  const sub = substitute;

  if (data.loading) {
    return <div className="flex-1 p-6"><p className="text-sm text-muted-foreground">Loading cohort…</p></div>;
  }
  if (!data.cohort) {
    return (
      <div className="flex-1 p-6">
        <h1 className="font-display text-2xl font-bold">Cohort Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">You're not enrolled in an active cohort yet. Once your manager enrols you, this is where you'll see your cohort, mentor, sessions, peers and more.</p>
      </div>
    );
  }

  const c = data.cohort;
  const peerOpen = (peer: HubPeer) =>
    setModal({
      title: `Connect with ${peer.name}`,
      description: peer.reason,
      meta: [{ label: "Role", value: peer.title, icon: "users" }],
      teamsLink: `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(peer.employeeId)}`,
      primaryLabel: "Send connect request",
    });
  const sessionOpen = (s: HubSession) =>
    setModal({
      title: s.title,
      description: s.description,
      meta: [
        { label: "When", value: fmtDayTime(s.startsAt) + ` · ${s.durationMinutes}m`, icon: "calendar" },
        s.hostName ? { label: "Host", value: s.hostName, icon: "users" } : null,
        s.location ? { label: "Where", value: s.location, icon: "map" } : null,
        { label: "Joined", value: `${s.joinedCount}/${s.capacity}`, icon: "users" },
      ].filter(Boolean) as any,
      teamsLink: s.teamsLink,
      primaryLabel: "Confirm join",
    });
  const groupOpen = (g: HubStudyGroup) =>
    setModal({
      title: `Join '${g.title}'`,
      description: g.focus,
      meta: [
        { label: "Schedule", value: g.scheduleText, icon: "calendar" },
        { label: "Members", value: `${g.members.length} learners`, icon: "users" },
      ],
      teamsLink: g.teamsLink,
      primaryLabel: "Join group",
    });
  const mentorMessage = () => data.mentor && setModal({
    title: `Message ${data.mentor.name}`,
    description: data.mentor.title,
    meta: [{ label: "Next 1:1", value: data.mentor.nextOneOnOneAt ? fmtDayTime(data.mentor.nextOneOnOneAt) : "Not scheduled", icon: "calendar" }],
    teamsLink: `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(data.mentor.employeeId)}`,
    primaryLabel: "Open in Teams",
  });
  const mentorBook = () => data.mentor && setModal({
    title: `Book session with ${data.mentor.name}`,
    description: "Pick a 30-min slot for your next 1:1.",
    meta: [{ label: "Suggested", value: data.mentor.nextOneOnOneAt ? fmtDayTime(data.mentor.nextOneOnOneAt) : "Thu 14 May, 10:30", icon: "calendar" }],
    teamsLink: data.mentor ? `https://teams.microsoft.com/l/meeting/new?subject=1:1%20with%20${encodeURIComponent(data.mentor.name)}` : undefined,
    primaryLabel: "Confirm booking",
  });

  return (
    <div className="flex-1 overflow-y-auto bg-background" data-tour="cohort-hub">
      <PageHeader
        title="Cohort Hub"
        subtitle={`Learn with peers, mentors, and cohort sessions · ${sub(c.title)}`}
      />

      <CohortHubBody
        data={data}
        c={c}
        sub={sub}
        peerOpen={peerOpen}
        sessionOpen={sessionOpen}
        groupOpen={groupOpen}
        mentorMessage={mentorMessage}
        mentorBook={mentorBook}
      />


      <JoinModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title || ""}
        description={modal?.description}
        meta={modal?.meta || []}
        teamsLink={modal?.teamsLink}
        primaryLabel={modal?.primaryLabel}
      />
    </div>
  );
}

interface BodyProps {
  data: ReturnType<typeof useCohortHub>;
  c: NonNullable<ReturnType<typeof useCohortHub>["cohort"]>;
  sub: (s: string) => string;
  peerOpen: (p: HubPeer) => void;
  sessionOpen: (s: HubSession) => void;
  groupOpen: (g: HubStudyGroup) => void;
  mentorMessage: () => void;
  mentorBook: () => void;
}

function CohortHubBody({ data, c, sub, peerOpen, sessionOpen, groupOpen, mentorMessage, mentorBook }: BodyProps) {
  const [params, setParams] = useSearchParams();
  const [achPage, setAchPage] = useState(0);
  const ACH_PAGE_SIZE = 6;
  const [pinned, setPinned] = useState<{ id: string; title: string; preview: string }[]>([
    { id: "p1", title: "Your fastest growth areas right now are…", preview: "Top three: client conversation skills, portfolio construction fundamentals, and regulatory horizon scanning. Focus your next two weeks here." },
    { id: "p2", title: "Top peer matches for IM track", preview: "Theo Mensah and Priya Anand are 1–2 modules ahead on the same track and have flagged availability for peer pairing." },
    { id: "p3", title: "What to prep for next 1:1 with Margaret", preview: "Bring your draft IPS for the Henderson case, two questions on risk profiling, and your reflection from Module 2." },
  ]);

  const tab = params.get("tab") === "adapted-path" ? "adapted-path" : "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab"); else next.set("tab", v);
    setParams(next, { replace: true });
  };

  const status = deriveHubStatus(data);
  const avg = cohortAvgPct(data);
  const toneStyles: Record<string, { bar: string; pill: string; icon: JSX.Element }> = {
    attention: { bar: "bg-destructive/5 border-destructive/20", pill: "bg-destructive/15 text-destructive border-destructive/30", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    action:    { bar: "bg-primary/5 border-primary/20",        pill: "bg-primary/15 text-primary border-primary/30",          icon: <Calendar className="h-3.5 w-3.5" /> },
    milestone: { bar: "bg-accent/10 border-accent/30",         pill: "bg-accent/20 text-accent-foreground border-accent/40",  icon: <Flag className="h-3.5 w-3.5" /> },
    ontrack:   { bar: "bg-muted/30 border-border",             pill: "bg-muted text-muted-foreground border-border",          icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  };
  const t = toneStyles[status.tone];
  const nextGateTitle = data.nextModuleGate.replace(/^MODULE GATE \d+\s*—\s*/i, "") || "—";

  const reco = [
    { icon: Users, title: "Schedule 1:1 with mentor", sub: "You haven't met in 14 days", onClick: mentorBook },
    { icon: Users, title: "Pair with a peer", sub: `${data.peerMatches.length || 2} suggested matches`, onClick: () => data.peerMatches[0] && peerOpen(data.peerMatches[0]) },
    { icon: Calendar, title: "Join next live session", sub: data.upcomingSessions[0] ? data.upcomingSessions[0].title : "No sessions scheduled", onClick: () => data.upcomingSessions[0] && sessionOpen(data.upcomingSessions[0]) },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="adapted-path">Adapted path</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* MAIN COLUMN */}
            <div className="space-y-6 min-w-0">
              {/* Status banner + 4 KPI tiles */}
              <Card className="overflow-hidden">
                <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${t.bar}`}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${t.pill}`}>
                    {t.icon}{status.label}
                  </span>
                  <p className="flex-1 min-w-0 text-sm text-foreground">{status.headline}</p>
                  {status.cta && (
                    status.cta.to?.startsWith("/") ? (
                      <Button asChild size="sm" variant={status.tone === "attention" ? "default" : "outline"}>
                        <Link to={status.cta.to}>{status.cta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => {
                        if (status.cta?.to?.startsWith("#")) document.querySelector(status.cta.to)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}>
                        {status.cta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )
                  )}
                </div>

                <div className="group/strip flex flex-col gap-px bg-border md:grid md:grid-cols-2 lg:flex lg:flex-row">
                  {/* Your progress */}
                  <div className="group/tile relative flex-1 lg:flex-[1] bg-card p-4 transition-[flex-grow] duration-300 ease-out lg:hover:flex-[1.6] lg:focus-within:flex-[1.6] min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Trophy className="h-3 w-3" /> Your progress</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground">{data.yourPct}%</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.max(data.yourPct, 2)}%` }} /></div>
                    <div className="mt-1.5 text-xs text-muted-foreground">Cohort avg {avg}%</div>
                    <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover/tile:max-h-32 group-hover/tile:grid-rows-[1fr] group-hover/tile:opacity-100 group-focus-within/tile:max-h-32 group-focus-within/tile:grid-rows-[1fr] group-focus-within/tile:opacity-100">
                      <div className="min-h-0 pt-2 text-[11px] text-muted-foreground">
                        You're <b className="text-foreground">{Math.max(0, data.yourPct - avg)}%</b> ahead of the cohort average · ranked <b className="text-foreground">#{data.yourRank || "—"}</b> of {data.totalLearners || "—"}.
                      </div>
                    </div>
                  </div>

                  {/* Time remaining */}
                  <div className="group/tile relative flex-1 lg:flex-[1] bg-card p-4 transition-[flex-grow] duration-300 ease-out lg:hover:flex-[1.6] lg:focus-within:flex-[1.6] min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Time remaining</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground">{data.daysLeft > 0 ? `${data.daysLeft} days` : "—"}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Due {fmtDate(c.dueDate)}</div>
                    <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover/tile:max-h-32 group-hover/tile:grid-rows-[1fr] group-hover/tile:opacity-100 group-focus-within/tile:max-h-32 group-focus-within/tile:grid-rows-[1fr] group-focus-within/tile:opacity-100">
                      <div className="min-h-0 pt-2 text-[11px] text-muted-foreground">
                        Programme started {fmtDate(c.startDate)} · keep pace to graduate on schedule with the cohort.
                      </div>
                    </div>
                  </div>

                  {/* Currently learning */}
                  <Link to="/" className="group/tile relative flex-1 lg:flex-[1.2] bg-card p-4 transition-[flex-grow,background-color] duration-300 ease-out hover:bg-muted/30 lg:hover:flex-[1.8] lg:focus-within:flex-[1.8] min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><BookOpen className="h-3 w-3" /> Currently learning</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground line-clamp-1 group-hover/tile:text-primary transition-colors">{data.nextChapter || "—"}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">Chapter in progress · continue →</div>
                    <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover/tile:max-h-32 group-hover/tile:grid-rows-[1fr] group-hover/tile:opacity-100 group-focus-within/tile:max-h-32 group-focus-within/tile:grid-rows-[1fr] group-focus-within/tile:opacity-100">
                      <div className="min-h-0 pt-2 text-[11px] text-muted-foreground line-clamp-2">
                        Next up after this chapter: keep momentum with Embark AI's recommended sequence.
                      </div>
                    </div>
                  </Link>

                  {/* Mentor — gets the most real estate */}
                  <div className="group/tile relative flex-1 lg:flex-[1.7] bg-card p-4 transition-[flex-grow] duration-300 ease-out lg:hover:flex-[2.2] lg:focus-within:flex-[2.2] min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"><Users className="h-3 w-3" /> Your mentor</div>
                    {data.mentor ? (
                      <>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Avatar className="h-9 w-9"><AvatarFallback className="text-[11px] bg-muted">{initials(data.mentor.name)}</AvatarFallback></Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-sm font-bold leading-tight text-foreground">{data.mentor.name}</div>
                            <div className="text-[11px] text-muted-foreground">{data.mentor.title}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <Button size="sm" variant="outline" className="flex-1" onClick={mentorMessage}><MessageCircle className="mr-1 h-3.5 w-3.5" />Message</Button>
                          <Button size="sm" className="flex-1" onClick={mentorBook}>Book 1:1</Button>
                        </div>
                        <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover/tile:max-h-32 group-hover/tile:grid-rows-[1fr] group-hover/tile:opacity-100 group-focus-within/tile:max-h-32 group-focus-within/tile:grid-rows-[1fr] group-focus-within/tile:opacity-100">
                          <div className="min-h-0 pt-2 text-[11px] text-muted-foreground">
                            Last met 14 days ago · next 1:1 suggested this week. Margaret typically replies within a few hours.
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-xs text-muted-foreground">No mentor assigned yet.</div>
                    )}
                  </div>
                </div>

              </Card>

              {/* Recommended actions + Achievements */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">

                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Recommended actions</h2>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {reco.map((r, i) => (
                      <button key={i} onClick={r.onClick} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted/40">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted"><r.icon className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="flex-1"><div className="text-sm font-semibold">{r.title}</div><div className="text-xs text-muted-foreground">{r.sub}</div></div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>

                </Card>


                <Card className="relative overflow-hidden p-6 flex flex-col">

                  {/* decorative glows */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />

                  {(() => {
                    const earned = data.achievements.filter((a) => a.earned).length;
                    const total = data.achievements.length || 1;
                    const pointsEarned = data.achievements.filter((a) => a.earned).reduce((s, a) => s + a.points, 0);
                    const pointsTotal = data.achievements.reduce((s, a) => s + a.points, 0) || 1;
                    const ptsPct = Math.round((pointsEarned / pointsTotal) * 100);
                    const firstLocked = data.achievements.find((a) => !a.earned);

                    const ICONS: Record<string, typeof Trophy> = {
                      first_quiz: CheckCircle2,
                      "5_day_streak": Flame,
                      "30_day_streak": Flame,
                      module_1: BookOpen,
                      module_2: BookOpen,
                      module_3: BookOpen,
                      module_4: BookOpen,
                      peer_mentor: Users,
                      mock_ace: Target,
                      top_10: Trophy,
                      cisi_l4: GraduationCap,
                      fca_notified: ShieldCheck,
                      first_reflection: PencilLine,
                      cohort_lead_nom: Crown,
                      programme_grad: Rocket,
                      client_handover: Briefcase,
                    };
                    const TIER_EARNED: Record<string, string> = {
                      bronze: "border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-300",
                      silver: "border-sky-500/40 bg-gradient-to-br from-sky-500/15 to-indigo-500/10 text-sky-700 dark:text-sky-300",
                      gold:   "border-amber-400/50 bg-gradient-to-br from-amber-400/25 to-rose-400/15 text-amber-700 dark:text-amber-200 shadow-[0_2px_12px_-4px_hsl(38_92%_50%/0.4)]",
                    };
                    const TIER_ICON_BG: Record<string, string> = {
                      bronze: "bg-amber-500/20",
                      silver: "bg-sky-500/20",
                      gold:   "bg-amber-400/30",
                    };

                    const pageCount = Math.max(1, Math.ceil(data.achievements.length / ACH_PAGE_SIZE));
                    const safePage = Math.min(achPage, pageCount - 1);
                    const pageItems = data.achievements.slice(safePage * ACH_PAGE_SIZE, safePage * ACH_PAGE_SIZE + ACH_PAGE_SIZE);

                    return (
                      <>
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Milestones earned</div>
                            <h2 className="font-display text-lg font-bold">Achievements</h2>
                            <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{earned} of {total} unlocked</div>
                          </div>
                          <div className="shrink-0">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-400/20 to-rose-400/15 px-2.5 py-1">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-display text-sm font-bold tabular-nums text-foreground">{pointsEarned}</span>
                              <span className="text-[11px] text-muted-foreground">pts</span>
                            </div>
                          </div>
                        </div>

                        <div key={safePage} className="relative mt-4 flex flex-col gap-1.5">
                          {Array.from({ length: Math.ceil(pageItems.length / 3) }).map((_, rowIdx) => {
                            const row = pageItems.slice(rowIdx * 3, rowIdx * 3 + 3);
                            return (
                              <div key={rowIdx} className="flex gap-1.5">
                                {row.map((a) => {
                                  const Icon = ICONS[a.code] ?? Award;
                                  const earned = a.earned;
                                  return (
                                    <div
                                      key={a.code}
                                      className="group/pill flex-1 min-w-0 basis-0 hover:flex-[2.5] transition-[flex] duration-200"
                                    >
                                      <div
                                        title={earned ? `${a.label} · +${a.points} pts` : `Locked · ${a.label}`}
                                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 min-w-0 w-full ${
                                          earned
                                            ? TIER_EARNED[a.tier]
                                            : "border-dashed border-border bg-muted/30 opacity-70"
                                        }`}
                                      >
                                        <div
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                            earned ? TIER_ICON_BG[a.tier] : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {earned ? <Icon className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                        </div>
                                        <div className="flex min-w-0 flex-1 items-baseline gap-1">
                                          <span
                                            className={`truncate whitespace-nowrap text-[11px] font-semibold leading-tight ${
                                              earned ? "text-foreground" : "text-muted-foreground"
                                            }`}
                                          >
                                            {a.label}
                                          </span>
                                          {earned && (
                                            <span className="hidden shrink-0 text-[10px] font-medium text-muted-foreground group-hover/pill:inline">
                                              +{a.points}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {row.length < 3 &&
                                  Array.from({ length: 3 - row.length }).map((_, i) => (
                                    <div key={`spacer-${i}`} className="flex-1 min-w-0 basis-0" />
                                  ))}
                              </div>
                            );
                          })}
                        </div>


                        <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                          <div className="min-w-0 truncate">
                            {firstLocked ? (
                              <>Next: <span className="font-medium text-foreground">{firstLocked.label}</span></>
                            ) : (
                              <>All milestones unlocked — nice work.</>
                            )}
                          </div>
                          {pageCount > 1 && (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setAchPage((p) => Math.max(0, p - 1))}
                                disabled={safePage === 0}
                                aria-label="Previous achievements"
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <span className="tabular-nums">{safePage + 1} / {pageCount}</span>
                              <button
                                type="button"
                                onClick={() => setAchPage((p) => Math.min(pageCount - 1, p + 1))}
                                disabled={safePage >= pageCount - 1}
                                aria-label="Next achievements"
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </Card>

              </div>

              {/* Cohort vs you */}
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold">Cohort vs you</h2>
                    <p className="text-xs text-muted-foreground">Progress by track — your completion vs the cohort average across each learning track.</p>
                  </div>
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>

                <div className="mt-4 space-y-4">
                  {data.moduleProgress.length === 0 && <p className="text-sm text-muted-foreground">No module data yet.</p>}
                  <StaggerList className="space-y-4">
                    {data.moduleProgress.map((m) => (
                      <StaggerItem key={m.trackCode}>
                        <div>
                          <div className="flex items-baseline justify-between text-sm">
                            <span className="font-medium">{m.trackName}</span>
                            <span className="text-muted-foreground">Cohort <b className="text-foreground">{m.cohortAvgPct}%</b> · You <b className="text-foreground">{m.youPct}%</b></span>
                          </div>
                          <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-muted">
                            <div className="absolute inset-y-0 left-0 bg-muted-foreground/40" style={{ width: `${m.cohortAvgPct}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${Math.max(m.youPct, 1)}%` }} />
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerList>

                  <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Cohort avg</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> You</span>
                  </div>
                </div>
              </Card>

              {/* Unified co-learning timeline */}
              <CoLearningTimeline
                upcomingSessions={data.upcomingSessions}
                classroomSessions={data.classroomSessions}
                studyGroups={data.studyGroups}
                onSessionOpen={sessionOpen}
                onGroupOpen={groupOpen}
              />

              {/* Unified people list */}
              <PeopleToConnect
                peopleSimilar={data.peopleSimilar}
                peerMatches={data.peerMatches}
                onConnect={peerOpen}
              />

              {/* Mentor · Evidence */}
              <div className="grid gap-6 lg:grid-cols-2">


                <Card className="p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Your mentor</div>
                  {data.mentor ? (
                    <>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar className="h-12 w-12"><AvatarFallback>{initials(data.mentor.name)}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-display text-lg font-bold">{data.mentor.name}</div>
                          <div className="text-xs text-muted-foreground">{data.mentor.title}</div>
                        </div>
                      </div>
                      {data.mentor.notes && <p className="mt-3 border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">"{sub(data.mentor.notes)}"</p>}
                      {data.mentor.nextOneOnOneAt && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Next 1:1 · {fmtDayTime(data.mentor.nextOneOnOneAt)}</div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={mentorMessage}><MessageCircle className="mr-1 h-3.5 w-3.5" /> Message</Button>
                        <Button size="sm" className="flex-1" onClick={mentorBook}>Book session</Button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No mentor assigned yet.</p>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Evidence captured</h2>
                    <Link to="#" className="text-xs text-muted-foreground hover:underline">View all ›</Link>
                  </div>
                  <div className="mt-4 space-y-2">
                    {data.evidence.map((e) => (
                      <div key={e.category} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/40">
                        <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /> {e.category}</div>
                        <div className="flex items-center gap-2 text-sm"><span className="tabular-nums text-muted-foreground">{e.count}</span><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* RIGHT RAIL */}
            <CohortRightRail
              announcements={data.announcements}
              recentActivity={data.recentActivity}
              leaderboard={data.leaderboard}
              substitute={sub}
            />
          </div>
        </TabsContent>

        <TabsContent value="adapted-path" className="mt-0">
          <AdaptedPathTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function PinnedRow({ title, preview, onRemove }: { title: string; preview: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-full border border-border bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 truncate text-left text-sm font-medium text-foreground"
          title={title}
        >
          {title}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove pin"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {preview}
        </div>
      )}
    </div>
  );
}
