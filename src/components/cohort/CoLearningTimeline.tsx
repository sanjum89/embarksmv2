import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Plus, Users, Video } from "lucide-react";
import type { HubSession, HubStudyGroup } from "@/hooks/useCohortHub";

type Kind = "live" | "classroom" | "study";

interface TimelineItem {
  id: string;
  kind: Kind;
  title: string;
  subtitle?: string;
  when: number;
  whenText: string;
  location?: string;
  past: boolean;
  raw: any;
}

interface Props {
  upcomingSessions: HubSession[];
  classroomSessions: HubSession[];
  studyGroups: HubStudyGroup[];
  onSessionOpen: (s: HubSession) => void;
  onGroupOpen: (g: HubStudyGroup) => void;
}

function fmtDayTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function bucket(t: number, now: number): "thisWeek" | "nextWeek" | "later" | "earlier" {
  const oneDay = 86400000;
  const diff = t - now;
  if (diff < 0) return "earlier";
  if (diff < 7 * oneDay) return "thisWeek";
  if (diff < 14 * oneDay) return "nextWeek";
  return "later";
}

const BUCKET_LABEL: Record<string, string> = {
  thisWeek: "This week",
  nextWeek: "Next week",
  later: "Later",
  earlier: "Earlier",
};

const KIND_LABEL: Record<Kind, string> = {
  live: "Live",
  classroom: "Classroom",
  study: "Study group",
};

export function CoLearningTimeline({ upcomingSessions, classroomSessions, studyGroups, onSessionOpen, onGroupOpen }: Props) {
  const [filter, setFilter] = useState<"all" | Kind>("all");

  const items: TimelineItem[] = useMemo(() => {
    const now = Date.now();
    const liveItems: TimelineItem[] = upcomingSessions.map((s) => ({
      id: `live-${s.id}`, kind: "live", title: s.title,
      subtitle: s.hostName ? `Hosted by ${s.hostName}` : undefined,
      when: new Date(s.startsAt).getTime(), whenText: fmtDayTime(s.startsAt),
      location: s.location, past: new Date(s.startsAt).getTime() < now, raw: s,
    }));
    const classItems: TimelineItem[] = classroomSessions.map((s) => ({
      id: `class-${s.id}`, kind: "classroom", title: s.title,
      subtitle: s.hostName, when: new Date(s.startsAt).getTime(),
      whenText: fmtDayTime(s.startsAt), location: s.location,
      past: new Date(s.startsAt).getTime() < now, raw: s,
    }));
    const groupItems: TimelineItem[] = studyGroups.map((g) => {
      const next = g.nextMeetingAt ? new Date(g.nextMeetingAt).getTime() : now + 1;
      return {
        id: `grp-${g.id}`, kind: "study", title: g.title,
        subtitle: g.focus, when: next,
        whenText: g.nextMeetingAt ? fmtDayTime(g.nextMeetingAt) : g.scheduleText,
        past: false, raw: g,
      };
    });
    return [...liveItems, ...classItems, ...groupItems].sort((a, b) => a.when - b.when);
  }, [upcomingSessions, classroomSessions, studyGroups]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const now = Date.now();
  const grouped = filtered.reduce<Record<string, TimelineItem[]>>((acc, it) => {
    const b = bucket(it.when, now);
    (acc[b] ||= []).push(it);
    return acc;
  }, {});
  const order: Array<keyof typeof BUCKET_LABEL> = ["thisWeek", "nextWeek", "later", "earlier"];

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Co-learning</h2>
          <p className="text-xs text-muted-foreground">Live sessions, classroom & offline, and study groups — all in one timeline.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "live", "classroom", "study"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${
                filter === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {k === "all" ? "All" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled in this view.</p>}
        {order.filter((b) => grouped[b]?.length).map((b) => (
          <div key={b}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{BUCKET_LABEL[b]}</div>
            <div className="space-y-2">
              {grouped[b]!.map((it) => (
                <div
                  key={it.id}
                  className={`flex items-start gap-3 rounded-md border p-3 ${it.past ? "border-dashed bg-muted/20" : "border-border"}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    {it.kind === "live" && <Video className="h-4 w-4 text-muted-foreground" />}
                    {it.kind === "classroom" && <MapPin className="h-4 w-4 text-muted-foreground" />}
                    {it.kind === "study" && <Users className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase tracking-wide ${
                          it.kind === "live" ? "border-primary/30 text-primary bg-primary/5"
                          : it.kind === "classroom" ? "border-accent/50 text-accent bg-accent/10"
                          : "border-border text-muted-foreground bg-muted/40"
                        }`}
                      >
                        {KIND_LABEL[it.kind]}
                      </Badge>
                      <span className="truncate text-sm font-semibold">{it.title}</span>
                    </div>
                    {it.subtitle && <div className="mt-0.5 truncate text-xs text-muted-foreground">{it.subtitle}</div>}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {it.whenText}</span>
                      {it.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {it.location}</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {it.kind === "study" ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onGroupOpen(it.raw)}>Join group</Button>
                    ) : it.past ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Reflect</Button>
                    ) : (
                      <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onSessionOpen(it.raw)}>
                        {it.kind === "live" ? <><Video className="h-3 w-3" /> Join</> : "Details"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
