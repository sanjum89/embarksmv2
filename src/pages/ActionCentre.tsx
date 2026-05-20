import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { useUser } from "@/contexts/UserContext";
import { useManagerActions } from "@/store/useManagerActions";
import { useActionCentreFeed } from "@/hooks/useActionCentreFeed";
import TimeBucketGroup from "@/components/action-centre/TimeBucketGroup";
import AIRecommendationStream from "@/components/action-centre/AIRecommendationStream";
import EmptyState from "@/components/action-centre/EmptyState";
import { LearnerDrawer } from "@/components/manager-hub/LearnerDrawer";
import { RaisedHandDrawer } from "@/components/manager-hub/RaisedHandDrawer";
import { Schedule1on1Dialog } from "@/components/team-home/Schedule1on1Dialog";
import { SendCheckInDialog } from "@/components/team-home/SendCheckInDialog";
import { COHORT_MODULES_FALLBACK, type ActionItem } from "@/data/managerDemoOverlay";
import { useAccount } from "@/contexts/AccountContext";
import { useRathbonesPersonaOverlays } from "@/hooks/useRathbonesPersonaOverlays";
import { cn } from "@/lib/utils";
import type { CategoryFilter, ActionFeedItem } from "@/lib/actionCentre/itemKinds";

const FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mentions", label: "Mentions" },
  { key: "approvals", label: "Approvals" },
  { key: "ai", label: "AI" },
];

export default function ActionCentre() {
  const { user } = useUser();
  const { normalizedAccount } = useAccount();
  const { overlays } = useRathbonesPersonaOverlays();
  const { recordDecision } = useManagerActions();
  const feed = useActionCentreFeed();

  const [openLearnerId, setOpenLearnerId] = useState<string | null>(null);
  const [handAction, setHandAction] = useState<ActionItem | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);

  const employeesById = normalizedAccount?.employeesById ?? {};
  const selectedOverlay = overlays.find((o) => o.employeeId === openLearnerId) ?? null;
  const nameOf = (id: string) => employeesById[id]?.name || id;
  const titleOf = (id: string) => employeesById[id]?.title || "Learner";

  const handlePrimaryCta = (item: ActionFeedItem) => {
    const src = item.source as ActionItem | undefined;
    if (item.kind === "raised_hand" && src) {
      setHandAction(src);
      return;
    }
    if (item.kind === "approval_request" && src) {
      recordDecision(src.id, "approved", user.name);
      feed.markDone(item.id);
      toast.success("Approved");
      return;
    }
    if (item.kind === "reflection_review" && src) {
      setOpenLearnerId(src.employeeId);
      return;
    }
    if (item.ai) {
      toast.success("On it — I'll build this for you.");
      feed.markDone(item.id);
      return;
    }
    feed.markDone(item.id);
  };

  const onSnooze = (id: string) => { feed.snooze(id); toast("Snoozed", { description: "We'll bring it back later." }); };
  const onDone = (id: string) => { feed.markDone(id); toast.success("Marked done"); };
  const onDismiss = (id: string) => { feed.dismiss(id); };

  const headerSummary = (() => {
    const { now, today, this_week } = feed.countByBucket;
    if (feed.totalOpen === 0) return "Inbox zero — nothing needs you right now.";
    const parts: string[] = [];
    if (now) parts.push(`${now} need you now`);
    if (today) parts.push(`${today} today`);
    if (this_week) parts.push(`${this_week} this week`);
    return parts.join(" · ");
  })();

  const showEmpty = feed.totalOpen === 0 && feed.ai.length === 0;

  return (
    <div className="flex-1 overflow-y-auto" data-tour="action-centre">
      <PageHeader
        title="Action Centre"
      />

      <div className="px-6 pt-4 pb-6">
        {/* Status sentence + filter pills */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border/60">
          <p className="text-sm text-muted-foreground">{headerSummary}</p>
          <div className="ml-auto inline-flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => feed.setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  feed.filter === f.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {showEmpty ? (
          <EmptyState />
        ) : (
          <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {feed.totalOpen === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <TimeBucketGroup priority="now"       items={feed.buckets.now}       onSnooze={onSnooze} onDone={onDone} onDismiss={onDismiss} />
                  <TimeBucketGroup priority="today"     items={feed.buckets.today}     onSnooze={onSnooze} onDone={onDone} onDismiss={onDismiss} />
                  <TimeBucketGroup priority="this_week" items={feed.buckets.this_week} onSnooze={onSnooze} onDone={onDone} onDismiss={onDismiss} />
                  <TimeBucketGroup priority="later"     items={feed.buckets.later}     onSnooze={onSnooze} onDone={onDone} onDismiss={onDismiss} />
                </>
              )}
            </div>

            <AIRecommendationStream items={feed.ai} onDismiss={onDismiss} />
          </div>
        )}
      </div>

      <LearnerDrawer
        open={!!openLearnerId}
        onOpenChange={(o) => !o && setOpenLearnerId(null)}
        learner={selectedOverlay ? { employeeId: selectedOverlay.employeeId, name: nameOf(selectedOverlay.employeeId), title: titleOf(selectedOverlay.employeeId) } : null}
        overlay={selectedOverlay}
        modules={COHORT_MODULES_FALLBACK.map((m) => ({ module_code: m.module_code, module_title: m.module_title, progression_stage: m.progression_stage }))}
      />
      <RaisedHandDrawer
        open={!!handAction}
        onOpenChange={(o) => !o && setHandAction(null)}
        action={handAction}
        learner={handAction ? { employeeId: handAction.employeeId, name: nameOf(handAction.employeeId), title: titleOf(handAction.employeeId) } : null}
        onScheduleOneOnOne={(id) => setScheduleId(id)}
        onSendCheckIn={(id) => setCheckInId(id)}
      />
      <Schedule1on1Dialog open={!!scheduleId} onOpenChange={(o) => !o && setScheduleId(null)} defaultLearnerId={scheduleId} />
      <SendCheckInDialog open={!!checkInId} onOpenChange={(o) => !o && setCheckInId(null)} defaultLearnerId={checkInId} />
    </div>
  );
}

// Re-export ActionRow so the bundle keeps the helper without unused imports.
