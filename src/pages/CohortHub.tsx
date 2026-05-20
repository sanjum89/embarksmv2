import { useMemo, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useCohortHub, type HubSession, type HubStudyGroup, type HubPeer } from "@/hooks/useCohortHub";
import { useContentSubstitution } from "@/lib/contentSubstitution";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { JoinModal } from "@/components/cohort-hub/JoinModal";

import {
  Users, Calendar, ChevronRight, Sparkles, Trophy, Award, MessageCircle,
  FileText, ArrowRight, AlertTriangle, CheckCircle2, Flag, BookOpen, Clock, Lock,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { deriveHubStatus, cohortAvgPct } from "@/lib/cohortHubStatus";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CoLearningTimeline } from "@/components/cohort/CoLearningTimeline";
import { PeopleToConnect } from "@/components/cohort/PeopleToConnect";
import { CohortRightRail } from "@/components/cohort/CohortRightRail";
import { AdaptedPathTab } from "@/components/cohort/AdaptedPathTab";

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
function fmtAgo(iso: string) {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
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

                <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-card p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Trophy className="h-3 w-3" /> Your progress</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground">{data.yourPct}%</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.max(data.yourPct, 2)}%` }} /></div>
                    <div className="mt-1.5 text-xs text-muted-foreground">Cohort avg {avg}%</div>
                  </div>
                  <div className="bg-card p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Time remaining</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground">{data.daysLeft > 0 ? `${data.daysLeft} days` : "—"}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Due {fmtDate(c.dueDate)}</div>
                  </div>
                  <Link to="/" className="bg-card p-4 transition-colors hover:bg-muted/30 group">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><BookOpen className="h-3 w-3" /> Currently learning</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{data.nextChapter || "—"}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">Chapter in progress · continue →</div>
                  </Link>
                  <div className="bg-card p-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Lock className="h-3 w-3" /> Up next</div>
                    <div className="mt-1 font-display text-xl font-bold text-foreground line-clamp-1">{nextGateTitle}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">Module gate · unlocks after this chapter</div>
                  </div>
                </div>
              </Card>

              {/* Recommended actions + Achievements */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
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

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Achievements</h2>
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.achievements.map((a) => (
                      <Badge key={a.code} variant="outline" className={a.earned
                        ? "border-amber-500/30 bg-amber-100/60 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                        : "border-dashed text-muted-foreground line-through opacity-60"}>{a.label}</Badge>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Cohort vs you */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Cohort vs you · progress by module</h2>
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div className="mt-4 space-y-4">
                  {data.moduleProgress.length === 0 && <p className="text-sm text-muted-foreground">No module data yet.</p>}
                  {data.moduleProgress.map((m) => (
                    <div key={m.trackCode}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium">{m.trackName}</span>
                        <span className="text-muted-foreground">Cohort <b className="text-foreground">{m.cohortAvgPct}%</b> · You <b className="text-foreground">{m.youPct}%</b></span>
                      </div>
                      <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="absolute inset-y-0 left-0 bg-muted-foreground/40" style={{ width: `${m.cohortAvgPct}%` }} />
                        <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${Math.max(m.youPct, 1)}%` }} />
                      </div>
                    </div>
                  ))}
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

              {/* Leaderboard · Mentor · Evidence */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top of the class</div>
                  <h2 className="mt-1 font-display text-lg font-bold">Cohort leaderboard</h2>
                  <div className="mt-4 space-y-2">
                    {data.leaderboard.length === 0 && <p className="text-sm text-muted-foreground">Leaderboard will populate as the cohort progresses.</p>}
                    {data.leaderboard.map((row) => (
                      <div key={row.employeeId} className={`flex items-center gap-3 rounded-md p-2 ${row.isYou ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}>
                        <span className="w-5 text-sm text-muted-foreground">{row.rank}</span>
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-muted">{initials(row.name)}</AvatarFallback></Avatar>
                        <span className="flex-1 text-sm font-medium">{row.isYou ? "You" : row.name}</span>
                        <span className="text-sm tabular-nums text-muted-foreground">{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

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

