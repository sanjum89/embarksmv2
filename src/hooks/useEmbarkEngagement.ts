import { useEffect, useRef, useState, useCallback } from "react";
import {
  useEmbark,
  resolveEffectiveTimings,
  type EngagementMode,
  type EngagementTimings,
} from "@/contexts/LearnPathContext";
import { subscribeEngagementEvents, type EngagementEvent } from "@/lib/embarkEngagementEvents";
import {
  pickIdleNudge,
  pickDwellNudge,
  pickPerformanceNudge,
  pickCompletionNudge,
  pickFarewellNudge,
  pickWelcomeBackNudge,
  type NudgeContext,
} from "@/lib/embarkNudges";
import {
  pickRetentionNudge,
  pickStrugglingStreakNudge,
  pickReopenNudge,
  pickRecoveryNudge,
} from "@/lib/embarkSupportiveMessages";

export interface PendingNudge {
  id: string;
  message: string;
  source:
    | "idle"
    | "dwell-soft"
    | "dwell-summary"
    | "performance"
    | "completion"
    | "farewell"
    | "welcome-back"
    | "retention"
    | "struggling"
    | "reopen"
    | "recovery";
}

interface UseEmbarkEngagementOptions {
  enabled: boolean;
  isStreaming: boolean;
  inputHasText: boolean;
  buildContext: () => NudgeContext;
}

const MAX_IDLE_NUDGES = 3; // soft, concrete, farewell
const MIN_GAP_MS = 20_000; // hard floor between any two nudges
const SAME_SOURCE_DEDUPE_MS = 30_000;

type Phase = "active" | "nudging" | "away";

export function useEmbarkEngagement({
  enabled,
  isStreaming,
  inputHasText,
  buildContext,
}: UseEmbarkEngagementOptions) {
  const { engagementMode, engagementTimings, activeModuleId } = useEmbark();
  const [pendingNudge, setPendingNudge] = useState<PendingNudge | null>(null);

  // Phase + counters that survive activity events
  const phaseRef = useRef<Phase>("active");
  const nudgesFiredRef = useRef(0);
  const cadenceMultiplierRef = useRef(1); // doubles after a welcome-back
  const dwellLevelFiredRef = useRef<{ soft: boolean; summary: boolean }>({ soft: false, summary: false });

  // Timing/dedup
  const lastNudgeAtRef = useRef(0);
  const lastNudgeSourceRef = useRef<{ source: string; at: number } | null>(null);

  // Timers
  const idleTimerRef = useRef<number | null>(null);
  const dwellSoftTimerRef = useRef<number | null>(null);
  const dwellSummaryTimerRef = useRef<number | null>(null);

  const lastModuleIdRef = useRef<string | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };
  const clearDwellTimers = () => {
    if (dwellSoftTimerRef.current !== null) {
      window.clearTimeout(dwellSoftTimerRef.current);
      dwellSoftTimerRef.current = null;
    }
    if (dwellSummaryTimerRef.current !== null) {
      window.clearTimeout(dwellSummaryTimerRef.current);
      dwellSummaryTimerRef.current = null;
    }
  };

  // Centralized dispatcher — enforces min gap + same-source dedupe.
  // Returns true if dispatched, false if suppressed.
  const dispatchNudge = useCallback((nudge: PendingNudge): boolean => {
    const now = Date.now();
    if (now - lastNudgeAtRef.current < MIN_GAP_MS) return false;
    const lastSrc = lastNudgeSourceRef.current;
    if (lastSrc && lastSrc.source === nudge.source && now - lastSrc.at < SAME_SOURCE_DEDUPE_MS) {
      return false;
    }
    lastNudgeAtRef.current = now;
    lastNudgeSourceRef.current = { source: nudge.source, at: now };
    setPendingNudge(nudge);
    return true;
  }, []);

  // Compute the escalating delay for the Nth idle nudge (0-indexed)
  const computeIdleDelayMs = (timings: EngagementTimings, attempt: number): number => {
    const mult = cadenceMultiplierRef.current;
    if (attempt === 0) return Math.max(timings.idleFirst, 1) * 1000 * mult;
    if (attempt === 1) return Math.max(timings.idleRepeat * 1.5, 1) * 1000 * mult;
    // attempt === 2 (farewell)
    return Math.max(timings.idleRepeat * 2.5, 1) * 1000 * mult;
  };

  const scheduleIdleTimer = useCallback(
    (timings: EngagementTimings) => {
      clearIdleTimer();
      if (phaseRef.current === "away") return;
      if (nudgesFiredRef.current >= MAX_IDLE_NUDGES) return;

      const attempt = nudgesFiredRef.current;
      const delayMs = computeIdleDelayMs(timings, attempt);

      idleTimerRef.current = window.setTimeout(() => {
        if (isStreaming || inputHasText) {
          // try again later — don't burn a nudge slot on a busy user
          scheduleIdleTimer(timings);
          return;
        }
        const ctx = buildContext();
        const isFarewell = attempt === MAX_IDLE_NUDGES - 1;

        const nudge: PendingNudge = isFarewell
          ? {
              id: `nudge-farewell-${Date.now()}`,
              message: pickFarewellNudge(ctx),
              source: "farewell",
            }
          : {
              id: `nudge-idle-${Date.now()}`,
              message: pickIdleNudge(ctx, attempt),
              source: "idle",
            };

        const dispatched = dispatchNudge(nudge);
        if (dispatched) {
          nudgesFiredRef.current += 1;
          phaseRef.current = isFarewell ? "away" : "nudging";
        }

        if (phaseRef.current !== "away" && nudgesFiredRef.current < MAX_IDLE_NUDGES) {
          scheduleIdleTimer(timings);
        }
      }, delayMs);
    },
    [buildContext, dispatchNudge, inputHasText, isStreaming]
  );

  const scheduleDwellTimers = useCallback(
    (timings: EngagementTimings) => {
      clearDwellTimers();
      if (phaseRef.current === "away") return;
      if (!activeModuleId) return;

      const mult = cadenceMultiplierRef.current;

      if (!dwellLevelFiredRef.current.soft) {
        dwellSoftTimerRef.current = window.setTimeout(() => {
          if (isStreaming || inputHasText) return;
          const ctx = buildContext();
          if (ctx.contentView !== "module") return;
          const dispatched = dispatchNudge({
            id: `nudge-dwell-soft-${Date.now()}`,
            message: pickDwellNudge(ctx, "soft"),
            source: "dwell-soft",
          });
          if (dispatched) dwellLevelFiredRef.current.soft = true;
        }, timings.dwellSoft * 1000 * mult);
      }

      if (!dwellLevelFiredRef.current.summary) {
        dwellSummaryTimerRef.current = window.setTimeout(() => {
          if (isStreaming || inputHasText) return;
          const ctx = buildContext();
          if (ctx.contentView !== "module") return;
          const dispatched = dispatchNudge({
            id: `nudge-dwell-summary-${Date.now()}`,
            message: pickDwellNudge(ctx, "summary"),
            source: "dwell-summary",
          });
          if (dispatched) dwellLevelFiredRef.current.summary = true;
        }, timings.dwellSummary * 1000 * mult);
      }
    },
    [activeModuleId, buildContext, dispatchNudge, inputHasText, isStreaming]
  );

  // Resolve timings & schedule
  useEffect(() => {
    if (!enabled) {
      clearIdleTimer();
      clearDwellTimers();
      return;
    }
    const timings = resolveEffectiveTimings(engagementMode, engagementTimings);
    if (!timings) {
      clearIdleTimer();
      clearDwellTimers();
      return;
    }
    scheduleIdleTimer(timings);
    scheduleDwellTimers(timings);
    return () => {
      clearIdleTimer();
      clearDwellTimers();
    };
  }, [enabled, engagementMode, engagementTimings, scheduleIdleTimer, scheduleDwellTimers]);

  // Reset dwell when active module changes (treat as fresh content engagement)
  useEffect(() => {
    if (lastModuleIdRef.current !== activeModuleId) {
      lastModuleIdRef.current = activeModuleId;
      dwellLevelFiredRef.current = { soft: false, summary: false };
      clearDwellTimers();
      const timings = resolveEffectiveTimings(engagementMode, engagementTimings);
      if (timings && enabled) scheduleDwellTimers(timings);
    }
  }, [activeModuleId, engagementMode, engagementTimings, enabled, scheduleDwellTimers]);

  // Listen to user activity & engagement events
  useEffect(() => {
    if (!enabled) return;

    // PASSIVE reset (mousemove): only restart current idle window — do NOT
    // touch nudgesFiredRef, phase, or exit AWAY.
    const passiveReset = () => {
      if (phaseRef.current === "away") return; // silent in AWAY
      if (nudgesFiredRef.current >= MAX_IDLE_NUDGES) return;
      const timings = resolveEffectiveTimings(engagementMode, engagementTimings);
      if (timings) scheduleIdleTimer(timings);
    };

    // REAL engagement (scroll/click/keydown): meaningful — if AWAY, fire
    // welcome-back ONCE, double cadence, reset counters and resume.
    const realEngagement = (kind: "scroll" | "click" | "keydown") => {
      const wasAway = phaseRef.current === "away";

      if (wasAway) {
        const ctx = buildContext();
        const dispatched = dispatchNudge({
          id: `nudge-welcome-back-${Date.now()}`,
          message: pickWelcomeBackNudge(ctx),
          source: "welcome-back",
        });
        if (dispatched) {
          cadenceMultiplierRef.current = Math.min(cadenceMultiplierRef.current * 2, 4);
        }
        phaseRef.current = "active";
        nudgesFiredRef.current = 0;
        dwellLevelFiredRef.current = { soft: false, summary: false };
      } else {
        // Active engagement during NUDGING/ACTIVE: fully reset idle progression.
        if (phaseRef.current === "nudging") {
          phaseRef.current = "active";
          nudgesFiredRef.current = 0;
        }
      }

      if (kind === "scroll") {
        dwellLevelFiredRef.current = { soft: false, summary: false };
      }

      const timings = resolveEffectiveTimings(engagementMode, engagementTimings);
      if (timings) {
        scheduleIdleTimer(timings);
        if (kind === "scroll") scheduleDwellTimers(timings);
      }
    };

    const handleEvent = (event: EngagementEvent) => {
      if (event.type === "user_activity") {
        if (event.kind === "mousemove") {
          passiveReset();
        } else {
          realEngagement(event.kind);
        }
        return;
      }

      if (event.type === "assessment_completed") {
        if (engagementMode === "focused" && event.score >= 50) return;
        const message = pickPerformanceNudge({
          type: "assessment",
          score: event.score,
          moduleTitle: event.moduleTitle ?? null,
        });
        dispatchNudge({
          id: `nudge-perf-asm-${Date.now()}`,
          message,
          source: "performance",
        });
        return;
      }

      if (event.type === "role_play_completed") {
        if (engagementMode === "focused" && event.rating >= 3) return;
        const message = pickPerformanceNudge({
          type: "rolePlay",
          rating: event.rating,
        });
        dispatchNudge({
          id: `nudge-perf-rp-${Date.now()}`,
          message,
          source: "performance",
        });
        return;
      }

      if (event.type === "module_completed") {
        if (engagementMode === "focused") return;
        dispatchNudge({
          id: `nudge-completion-${Date.now()}`,
          message: pickCompletionNudge(event.moduleTitle, event.nextModuleTitle ?? null),
          source: "completion",
        });
        return;
      }

      // NOTE: retention_gap_detected, module_reopened, and assessment_locked_critical_fail
      // are now handled directly in the Embark chat as synthetic assistant messages
      // (see LearnPathChat.tsx). We deliberately do NOT show transient banner nudges
      // for them here, to avoid duplicating the message in two places.
      if (event.type === "retention_gap_detected") return;
      if (event.type === "module_reopened") return;
      if (event.type === "assessment_locked_critical_fail") return;

      if (event.type === "struggling_streak") {
        dispatchNudge({
          id: `nudge-struggling-${Date.now()}`,
          message: pickStrugglingStreakNudge(),
          source: "struggling",
        });
        return;
      }

      if (event.type === "refresher_passed") {
        dispatchNudge({
          id: `nudge-recovery-${Date.now()}`,
          message: pickRecoveryNudge(event.topic),
          source: "recovery",
        });
      }
    };

    const unsubscribe = subscribeEngagementEvents(handleEvent);

    // DOM listeners — split passive vs real
    const onMouseMove = () => passiveReset();
    const onClick = () => realEngagement("click");
    const onKeydown = () => realEngagement("keydown");
    const onScroll = () => realEngagement("scroll");

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("scroll", onScroll, true);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Treat tab-return as real engagement (welcome-back if AWAY)
        realEngagement("click");
      } else {
        clearIdleTimer();
        clearDwellTimers();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    enabled,
    engagementMode,
    engagementTimings,
    scheduleIdleTimer,
    scheduleDwellTimers,
    dispatchNudge,
    buildContext,
  ]);

  const dismissNudge = useCallback(() => {
    setPendingNudge(null);
  }, []);

  return { pendingNudge, dismissNudge };
}
