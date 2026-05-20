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

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Top status bar */}
        {(() => {
          const status = deriveHubStatus(data);
          const avg = cohortAvgPct(data);
          const toneStyles: Record<string, { bar: string; pill: string; icon: JSX.Element }> = {
            attention: {
              bar: "bg-destructive/5 border-destructive/20",
              pill: "bg-destructive/15 text-destructive border-destructive/30",
              icon: <AlertTriangle className="h-3.5 w-3.5" />,
            },
            action: {
              bar: "bg-primary/5 border-primary/20",
              pill: "bg-primary/15 text-primary border-primary/30",
              icon: <Calendar className="h-3.5 w-3.5" />,
            },
            milestone: {
              bar: "bg-accent/10 border-accent/30",
              pill: "bg-accent/20 text-accent-foreground border-accent/40",
              icon: <Flag className="h-3.5 w-3.5" />,
            },
            ontrack: {
              bar: "bg-muted/30 border-border",
              pill: "bg-muted text-muted-foreground border-border",
              icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            },
          };
          const t = toneStyles[status.tone];
          const nextGateTitle = data.nextModuleGate.replace(/^MODULE GATE \d+\s*—\s*/i, "") || "—";

          return (
            <Card className="overflow-hidden">
              {/* Status banner */}
              <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${t.bar}`}>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${t.pill}`}>
                  {t.icon}
                  {status.label}
                </span>
                <p className="flex-1 min-w-0 text-sm text-foreground">{status.headline}</p>
                {status.cta && (
                  status.cta.to?.startsWith("/") ? (
                    <Button asChild size="sm" variant={status.tone === "attention" ? "default" : "outline"}>
                      <Link to={status.cta.to}>{status.cta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => {
                      if (status.cta?.to?.startsWith("#")) {
                        document.querySelector(status.cta.to)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}>
                      {status.cta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )
                )}
              </div>

              {/* 4 KPI tiles */}
              <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-4">
                {/* Your progress */}
                <div className="bg-card p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Trophy className="h-3 w-3" /> Your progress
                  </div>
                  <div className="mt-1 font-display text-xl font-bold text-foreground">{data.yourPct}%</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(data.yourPct, 2)}%` }} />
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">Cohort avg {avg}%</div>
                </div>

                {/* Time remaining */}
                <div className="bg-card p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3 w-3" /> Time remaining
                  </div>
                  <div className="mt-1 font-display text-xl font-bold text-foreground">
                    {data.daysLeft > 0 ? `${data.daysLeft} days` : "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Due {fmtDate(c.dueDate)}</div>
                </div>

                {/* Currently learning */}
                <Link
                  to="/"
                  className="bg-card p-4 transition-colors hover:bg-muted/30 group"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3 w-3" /> Currently learning
                  </div>
                  <div className="mt-1 font-display text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {data.nextChapter || "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    Chapter in progress · continue →
                  </div>
                </Link>

                {/* Up next */}
                <div className="bg-card p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Lock className="h-3 w-3" /> Up next
                  </div>
                  <div className="mt-1 font-display text-xl font-bold text-foreground line-clamp-1">
                    {nextGateTitle}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    Module gate · unlocks after this chapter
                  </div>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Row: Cohort vs You + Achievements */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
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

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Achievements</h2>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.achievements.map((a) => (
                <Badge
                  key={a.code}
                  variant="outline"
                  className={
                    a.earned
                      ? "border-amber-500/30 bg-amber-100/60 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                      : "border-dashed text-muted-foreground line-through opacity-60"
                  }
                >
                  {a.label}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* Row: Leaderboard + Mentor + Open sessions */}
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
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lead-led · Live</div>
            <h2 className="mt-1 font-display text-lg font-bold">Open sessions</h2>
            <div className="mt-4 space-y-3">
              {data.upcomingSessions.slice(0, 3).map((s) => (
                <div key={s.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.hostName}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">{fmtDayTime(s.startsAt).split(" · ")[0]}<br />{fmtDayTime(s.startsAt).split(" · ")[1]}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">{s.tags.slice(0, 2).map((t) => <Badge key={t} variant="secondary" className="text-[10px] uppercase">{t}</Badge>)}</div>
                    <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => sessionOpen(s)}><Video className="h-3 w-3" /> Join</Button>
                  </div>
                </div>
              ))}
              {data.upcomingSessions.length === 0 && <p className="text-sm text-muted-foreground">No upcoming sessions.</p>}
            </div>
          </Card>
        </div>

        {/* Row: People similar + Peer matches + Upcoming list */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">People learning similar topics</h2><Link to="#" className="text-xs text-muted-foreground hover:underline">View all ›</Link></div>
            <div className="mt-4 space-y-3">
              {data.peopleSimilar.map((p) => (
                <div key={p.employeeId} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9"><AvatarFallback className="bg-muted text-xs">{initials(p.name)}</AvatarFallback></Avatar>
                    {p.online && <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.title}</div>
                    {p.topicTag && <Badge variant="secondary" className="mt-1 text-[9px] uppercase">{p.topicTag}</Badge>}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => peerOpen(p)}>Connect</Button>
                </div>
              ))}
              {data.peopleSimilar.length === 0 && <p className="text-sm text-muted-foreground">No similar peers found yet.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Suggested peer matches</h2><Link to="#" className="text-xs text-muted-foreground hover:underline">View all ›</Link></div>
            <div className="mt-4 space-y-3">
              {data.peerMatches.map((p) => (
                <div key={p.employeeId} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="bg-muted text-xs">{initials(p.name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><div className="truncate text-sm font-semibold">{p.name}</div><div className="text-xs text-muted-foreground">{p.reason}</div></div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => peerOpen(p)}>Connect</Button>
                </div>
              ))}
              {data.peerMatches.length === 0 && <p className="text-sm text-muted-foreground">No suggested matches yet.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Upcoming sessions</h2><Link to="#" className="text-xs text-muted-foreground hover:underline">View calendar ›</Link></div>
            <div className="mt-4 space-y-3">
              {data.upcomingSessions.slice(0, 4).map((s) => (
                <button key={s.id} onClick={() => sessionOpen(s)} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted/40">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted"><Video className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{s.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.hostName} · {s.joinedCount}/{s.capacity} joined</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">{new Date(s.startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}<br />{new Date(s.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Row: Classroom sessions + Evidence + Recommended actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Classroom / offline sessions</h2><Link to="#" className="text-xs text-muted-foreground hover:underline">View all ›</Link></div>
            <div className="mt-4 space-y-3">
              {data.classroomSessions.map((s) => (
                <div key={s.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm">{s.title}</div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400">COMPLETED</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {fmtDayTime(s.startsAt)}</div>
                  {s.location && <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {s.location}</div>}
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Add reflection</Button>
                </div>
              ))}
              {data.classroomSessions.length === 0 && <p className="text-sm text-muted-foreground">No classroom sessions logged.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Evidence captured</h2><Link to="#" className="text-xs text-muted-foreground hover:underline">View all ›</Link></div>
            <div className="mt-4 space-y-2">
              {data.evidence.map((e) => (
                <div key={e.category} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/40">
                  <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /> {e.category}</div>
                  <div className="flex items-center gap-2 text-sm"><span className="tabular-nums text-muted-foreground">{e.count}</span><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Recommended actions</h2>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { icon: Users, title: "Schedule 1:1 with mentor", sub: "You haven't met in 14 days", onClick: mentorBook },
                { icon: Users, title: "Pair with a peer", sub: `${data.peerMatches.length || 2} suggested matches`, onClick: () => data.peerMatches[0] && peerOpen(data.peerMatches[0]) },
                { icon: Calendar, title: "Join 'Deep dive: MiFID II'", sub: "Wed 14 May, 13:00", onClick: () => data.upcomingSessions[0] && sessionOpen(data.upcomingSessions[0]) },
              ].map((r, i) => (
                <button key={i} onClick={r.onClick} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted/40">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted"><r.icon className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1"><div className="text-sm font-semibold">{r.title}</div><div className="text-xs text-muted-foreground">{r.sub}</div></div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Row: Study groups + Announcements + Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Self-organised</div>
            <h2 className="mt-1 font-display text-lg font-bold">Study groups</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {data.studyGroups.map((g) => (
                <div key={g.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between"><h3 className="font-display text-base font-bold">{g.title}</h3><Users className="h-4 w-4 text-muted-foreground" /></div>
                  <p className="mt-1 text-xs text-muted-foreground">{g.focus}</p>
                  <div className="mt-3 flex -space-x-1.5">
                    {g.members.slice(0, 5).map((m) => (
                      <Avatar key={m.id} className="h-6 w-6 ring-2 ring-card"><AvatarFallback className="text-[9px] bg-muted">{m.initials}</AvatarFallback></Avatar>
                    ))}
                    {g.members.length > 5 && <span className="ml-2 text-[10px] text-muted-foreground">+{g.members.length - 5}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {g.scheduleText}</div>
                  <Button size="sm" className="mt-3 w-full" onClick={() => groupOpen(g)}>Join group</Button>
                </div>
              ))}
              {data.studyGroups.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-3">No study groups yet — be the first to create one.</p>}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pinned</div>
                <Pin className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="mt-1 font-display text-lg font-bold">Cohort announcements</h2>
              <div className="mt-4 space-y-3">
                {data.announcements.map((a) => (
                  <div key={a.id} className="border-l-2 border-primary/40 pl-3">
                    <div className="text-[11px] text-muted-foreground">{a.authorName} · {a.authorRole} · {fmtAgo(a.postedAt)}</div>
                    <p className="mt-1 text-sm">{sub(a.body)}</p>
                  </div>
                ))}
                {data.announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements pinned yet.</p>}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live</div>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <h2 className="mt-1 font-display text-lg font-bold">Recent cohort activity</h2>
              <div className="mt-4 space-y-3">
                {data.recentActivity.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex gap-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.color === "amber" ? "bg-amber-500" : a.color === "indigo" ? "bg-indigo-500" : a.color === "emerald" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                    <div className="flex-1"><span className="font-semibold">{a.actorName}</span> <span className="text-muted-foreground">{a.body}</span><div className="text-[11px] text-muted-foreground">{a.ago}</div></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

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
