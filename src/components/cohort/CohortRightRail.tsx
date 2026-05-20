import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pin, Sparkles, Trophy } from "lucide-react";
import type { HubAnnouncement, HubActivity, HubLeaderboardRow } from "@/hooks/useCohortHub";

interface Props {
  announcements: HubAnnouncement[];
  recentActivity: HubActivity[];
  leaderboard: HubLeaderboardRow[];
  substitute: (s: string) => string;
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

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function CohortRightRail({ announcements, recentActivity, leaderboard, substitute }: Props) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start" aria-label="Cohort feed">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pinned</div>
          <Pin className="h-4 w-4 text-muted-foreground" />
        </div>
        <h2 className="mt-1 font-display text-base font-bold">Cohort announcements</h2>
        <div className="mt-3 space-y-3">
          {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements pinned yet.</p>}
          {announcements.map((a) => (
            <div key={a.id} className="border-l-2 border-primary/40 pl-3">
              <div className="text-[10px] text-muted-foreground">{a.authorName} · {a.authorRole} · {fmtAgo(a.postedAt)}</div>
              <p className="mt-1 text-sm leading-snug">{substitute(a.body)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Top of the class</div>
          <Trophy className="h-4 w-4 text-accent" />
        </div>
        <h2 className="mt-1 font-display text-base font-bold">Cohort leaderboard</h2>
        <div className="mt-3 space-y-1.5">
          {leaderboard.length === 0 && <p className="text-sm text-muted-foreground">Leaderboard will populate as the cohort progresses.</p>}
          {leaderboard.map((row) => (
            <div key={row.employeeId} className={`flex items-center gap-2.5 rounded-md p-1.5 ${row.isYou ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}>
              <span className="w-4 text-xs text-muted-foreground tabular-nums">{row.rank}</span>
              <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px] bg-muted">{initials(row.name)}</AvatarFallback></Avatar>
              <span className="flex-1 truncate text-xs font-medium">{row.isYou ? "You" : row.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{row.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live</div>
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <h2 className="mt-1 font-display text-base font-bold">Recent activity</h2>
        <div className="mt-3 space-y-2.5">
          {recentActivity.slice(0, 6).map((a) => (
            <div key={a.id} className="flex gap-2 text-sm">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                a.color === "amber" ? "bg-accent"
                : a.color === "indigo" ? "bg-primary"
                : a.color === "emerald" ? "bg-emerald-500"
                : "bg-muted-foreground"
              }`} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{a.actorName}</span>{" "}
                <span className="text-muted-foreground">{a.body}</span>
                <div className="text-[10px] text-muted-foreground">{a.ago}</div>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        </div>
      </Card>
    </aside>
  );
}
