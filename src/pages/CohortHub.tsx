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
