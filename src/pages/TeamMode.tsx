import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ChevronRight, CalendarPlus, MessageSquarePlus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";

import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { useAccountCohorts } from "@/hooks/useManagerCohortData";
import {
  RATHBONES_COHORT_ID,
  COHORT_MODULES_FALLBACK,
  type LearnerOverlay,
  type ActionItem,
} from "@/data/managerDemoOverlay";
import { useRathbonesPersonaOverlays } from "@/hooks/useRathbonesPersonaOverlays";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";
import { RaisedHandDrawer } from "@/components/manager-hub/RaisedHandDrawer";
import { Schedule1on1Dialog } from "@/components/team-home/Schedule1on1Dialog";
import { SendCheckInDialog } from "@/components/team-home/SendCheckInDialog";
import { RosterHeatmap } from "@/components/manager-hub/RosterHeatmap";


import { PulseStrip, type PulseTile } from "@/components/team-home/PulseStrip";
import { TeamRoster } from "@/components/team-home/TeamRoster";
import type { RosterEntry } from "@/components/team-home/RosterRow";
import { ActionQueue, type ActionQueueItem } from "@/components/team-home/ActionQueue";
import { MyCohortsCard, type CohortItem } from "@/components/team-home/MyCohortsCard";


function progressFromOverlay(o: LearnerOverlay) {
  const total = o.cells.length || 1;
  const completed = o.cells.filter((c) => c.status === "completed").length;
  const pct = Math.round((completed / total) * 100);
  return { total, completed, pct };
}

function lastActivityLabel(o: LearnerOverlay) {
  const inProg = o.cells.find((c) => c.status === "in_progress");
  if (inProg) return "Active today";
  const done = [...o.cells].reverse().find((c) => c.status === "completed");
  if (done?.last_activity) return `Last: ${done.last_activity}`;
  return "Not started";
}

export default function TeamMode() {
  const { normalizedAccount } = useAccount();
  const { user } = useUser();
  const { cohorts } = useAccountCohorts();
  const { overlays } = useRathbonesPersonaOverlays();
  const [openId, setOpenId] = useState<string | null>(null);
  const [handAction, setHandAction] = useState<ActionItem | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const selected = overlays.find((o) => o.employeeId === openId) ?? null;

  const openRaisedHand = (employeeId: string, actionId?: string) => {
    const overlay = overlays.find((o) => o.employeeId === employeeId);
    if (!overlay) return;
    const hand = actionId
      ? overlay.actions.find((a) => a.id === actionId && a.group === "raised_hand")
      : overlay.actions.find((a) => a.group === "raised_hand");
    if (hand) setHandAction(hand);
    else setOpenId(employeeId);
  };

  const employeesById = normalizedAccount?.employeesById ?? {};
  const nameOf = (id: string) => employeesById[id]?.name || id;
  const titleOf = (id: string) => employeesById[id]?.title || "Learner";

  const entries: RosterEntry[] = useMemo(
    () =>
      overlays.map((o) => {
        const { total, completed, pct } = progressFromOverlay(o);
        const cpd = o.cpd;
        const cpdHint = `${cpd.hours_logged}/${cpd.hours_required}h`;
        const cpdTone =
          cpd.status === "overdue" ? "rose" : cpd.status === "at_risk" ? "amber" : "emerald";
        return {
          employeeId: o.employeeId,
          name: nameOf(o.employeeId),
          title: titleOf(o.employeeId),
          overlay: o,
          progressPct: pct,
          completed,
          total,
          cpdHint,
          cpdTone,
          lastActivity: lastActivityLabel(o),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overlays, normalizedAccount]
  );

  const kpis = useMemo(() => {
    const learners = entries.length;
    const stars = entries.filter((e) => e.overlay.status === "rising_star").length;
    const needsAttn = entries.filter(
      (e) => e.overlay.status === "at_risk" || e.overlay.status === "needs_check_in"
    ).length;
    const avg = learners
      ? Math.round(entries.reduce((s, e) => s + e.progressPct, 0) / learners)
      : 0;
    const pendingActions = entries.reduce(
      (acc, e) =>
        acc +
        e.overlay.actions.filter((a) => a.severity !== "low").length +
        e.overlay.pathChanges.filter((c) => c.needs_approval).length,
      0
    );
    return { learners, stars, needsAttn, avg, pendingActions };
  }, [entries]);

  const tiles: PulseTile[] = [
    {
      key: "learners",
      label: "Active learners",
      value: kpis.learners,
      hint: "Across your reporting line",
      tone: "primary",
      icon: "users",
    },
    {
      key: "avg",
      label: "Avg progress",
      value: `${kpis.avg}%`,
      hint: "Mean across modules completed",
      tone: "emerald",
      icon: "trend",
    },
    {
      key: "stars",
      label: "Rising stars",
      value: kpis.stars,
      hint: "Outperforming targets",
      tone: "primary",
      icon: "spark",
    },
    {
      key: "attn",
      label: "Needs attention",
      value: kpis.needsAttn,
      hint: `${kpis.pendingActions} actions queued`,
      tone: kpis.needsAttn > 0 ? "amber" : "emerald",
      icon: "alert",
    },
  ];

  const queueItems: ActionQueueItem[] = useMemo(() => {
    const all: ActionQueueItem[] = [];
    for (const o of overlays) {
      for (const a of o.actions) {
        all.push({
          id: a.id,
          employeeId: o.employeeId,
          learnerName: nameOf(o.employeeId),
          title: a.title,
          detail: a.detail,
          severity: a.severity,
          kind: a.group,
        });
      }
    }
    const rank = { high: 0, medium: 1, low: 2 };
    return all.sort((a, b) => rank[a.severity] - rank[b.severity]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlays, normalizedAccount]);

  const cohortItems: CohortItem[] = useMemo(
    () =>
      cohorts.map((c) => ({
        id: c.id,
        title: c.cohort_title,
        code: c.role_cohort_code ?? "",
        learnerCount: 0,
        progressPct: 0,
      })),
    [cohorts]
  );

  const summary = `${kpis.learners} associates · ${kpis.stars} rising stars · ${kpis.needsAttn} need attention · ${kpis.pendingActions} actions queued`;

  const eyebrow = useModeEyebrow();
  const managerName = user?.name ?? "Manager";
  const managerTitle = (user as any)?.title ?? "Team Lead";

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        eyebrow={eyebrow}
        title={managerName}
        subtitle={`${managerTitle} · ${summary}`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Schedule 1:1
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCheckInOpen(true)}>
              <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" /> Check-in
            </Button>
            <Button size="sm" asChild>
              <Link to="/action-centre">
                <Inbox className="mr-1.5 h-3.5 w-3.5" /> Action Centre
              </Link>
            </Button>
          </>
        }
      />
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">

        <PulseStrip tiles={tiles} />

        {/* Two-column body */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <TeamRoster entries={entries} onOpen={setOpenId} onOpenRaisedHand={openRaisedHand} />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <ActionQueue
              items={queueItems}
              onOpen={(employeeId, item) => {
                if (item?.kind === "raised_hand") openRaisedHand(employeeId, item.id);
                else setOpenId(employeeId);
              }}
            />
            <MyCohortsCard cohorts={cohortItems} />
          </div>
        </div>

        {/* Heatmap */}
        <section className="mt-8">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Module progress</h2>
                <p className="text-xs text-muted-foreground">
                  Investment Management Readiness · Jan 2026
                </p>
              </div>
              <Link
                to={`/manager/cohort/${RATHBONES_COHORT_ID}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Open cohort <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto p-4">
              <RosterHeatmap
                learners={entries.map((e) => ({
                  employeeId: e.employeeId,
                  name: e.name,
                  title: e.title,
                  overlay: e.overlay,
                }))}
                modules={COHORT_MODULES_FALLBACK.map((m) => ({
                  module_code: m.module_code,
                  module_title: m.module_title,
                  progression_stage: m.progression_stage,
                }))}
                onSelectLearner={(id) => setOpenId(id)}
              />
            </div>
          </Card>
        </section>

      </div>

      <LearnerDrawer
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
        learner={
          selected
            ? {
                employeeId: selected.employeeId,
                name: nameOf(selected.employeeId),
                title: titleOf(selected.employeeId),
              }
            : null
        }
        overlay={selected}
        modules={COHORT_MODULES_FALLBACK.map((m) => ({
          module_code: m.module_code,
          module_title: m.module_title,
          progression_stage: m.progression_stage,
        }))}
      />

      <RaisedHandDrawer
        open={!!handAction}
        onOpenChange={(o) => !o && setHandAction(null)}
        action={handAction}
        learner={
          handAction
            ? {
                employeeId: handAction.employeeId,
                name: nameOf(handAction.employeeId),
                title: titleOf(handAction.employeeId),
              }
            : null
        }
        onScheduleOneOnOne={(id) => setScheduleId(id)}
        onSendCheckIn={(id) => setCheckInId(id)}
      />

      <Schedule1on1Dialog
        open={!!scheduleId || scheduleOpen}
        onOpenChange={(o) => { if (!o) { setScheduleId(null); setScheduleOpen(false); } }}
        defaultLearnerId={scheduleId ?? undefined}
      />
      <SendCheckInDialog
        open={!!checkInId || checkInOpen}
        onOpenChange={(o) => { if (!o) { setCheckInId(null); setCheckInOpen(false); } }}
        defaultLearnerId={checkInId ?? undefined}
      />
    </div>
  );
}
