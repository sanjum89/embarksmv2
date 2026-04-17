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
  type NudgeContext,
} from "@/lib/embarkNudges";

export interface PendingNudge {
  id: string;
  message: string;
  source: "idle" | "dwell-soft" | "dwell-summary" | "performance" | "completion";
}

interface UseEmbarkEngagementOptions {
  enabled: boolean;
  isStreaming: boolean;
  inputHasText: boolean;
  buildContext: () => NudgeContext;
}

const MAX_IDLE_NUDGES = 3;

export function useEmbarkEngagement({
  enabled,
  isStreaming,
  inputHasText,
  buildContext,
}: UseEmbarkEngagementOptions) {
  const { engagementMode, engagementTimings, activeModuleId } = useEmbark();
  const [pendingNudge, setPendingNudge] = useState<PendingNudge | null>(null);

  const idleAttemptRef = useRef(0);
  const dwellLevelFiredRef = useRef<{ soft: boolean; summary: boolean }>({ soft: false, summary: false });
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

  const scheduleIdleTimer = useCallback(
    (timings: EngagementTimings, mode: EngagementMode) => {
      clearIdleTimer();
      if (idleAttemptRef.current >= MAX_IDLE_NUDGES) return;

      const delaySec = idleAttemptRef.current === 0 ? timings.idleFirst : timings.idleRepeat;

      idleTimerRef.current = window.setTimeout(() => {
        if (isStreaming || inputHasText) {
          // try again later
          scheduleIdleTimer(timings, mode);
          return;
        }
        const ctx = buildContext();
        const message = pickIdleNudge(ctx, idleAttemptRef.current);
        setPendingNudge({
          id: `nudge-idle-${Date.now()}`,
          message,
          source: "idle",
        });
        idleAttemptRef.current += 1;
        // schedule next idle nudge
        if (idleAttemptRef.current < MAX_IDLE_NUDGES) {
          scheduleIdleTimer(timings, mode);
        }
      }, delaySec * 1000);
    },
    [buildContext, inputHasText, isStreaming]
  );

  const scheduleDwellTimers = useCallback(
    (timings: EngagementTimings) => {
      clearDwellTimers();
      if (!activeModuleId) return;

      if (!dwellLevelFiredRef.current.soft) {
        dwellSoftTimerRef.current = window.setTimeout(() => {
          if (isStreaming || inputHasText) return;
          const ctx = buildContext();
          if (ctx.contentView !== "module") return;
          setPendingNudge({
            id: `nudge-dwell-soft-${Date.now()}`,
            message: pickDwellNudge(ctx, "soft"),
            source: "dwell-soft",
          });
          dwellLevelFiredRef.current.soft = true;
        }, timings.dwellSoft * 1000);
      }

      if (!dwellLevelFiredRef.current.summary) {
        dwellSummaryTimerRef.current = window.setTimeout(() => {
          if (isStreaming || inputHasText) return;
          const ctx = buildContext();
          if (ctx.contentView !== "module") return;
          setPendingNudge({
            id: `nudge-dwell-summary-${Date.now()}`,
            message: pickDwellNudge(ctx, "summary"),
            source: "dwell-summary",
          });
          dwellLevelFiredRef.current.summary = true;
        }, timings.dwellSummary * 1000);
      }
    },
    [activeModuleId, buildContext, inputHasText, isStreaming]
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
    scheduleIdleTimer(timings, engagementMode);
    scheduleDwellTimers(timings);
    return () => {
      clearIdleTimer();
      clearDwellTimers();
    };
  }, [enabled, engagementMode, engagementTimings, scheduleIdleTimer, scheduleDwellTimers]);

  // Reset dwell when active module changes
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

    const resetIdle = () => {
      idleAttemptRef.current = 0;
      const timings = resolveEffectiveTimings(engagementMode, engagementTimings);
      if (timings) scheduleIdleTimer(timings, engagementMode);
    };
    const resetDwell = () => {
      dwellLevelFiredRef.current = { soft: false, summary: false };
      const timings = resolveEffectiveTimings(engagementMode, engagementTimings);
      if (timings) scheduleDwellTimers(timings);
    };

    const handleEvent = (event: EngagementEvent) => {
      if (event.type === "user_activity") {
        resetIdle();
        if (event.kind === "scroll") resetDwell();
        return;
      }

      if (event.type === "assessment_completed") {
        // Critical-only filter for focused mode
        if (engagementMode === "focused" && event.score >= 50) return;
        const message = pickPerformanceNudge({
          type: "assessment",
          score: event.score,
          moduleTitle: event.moduleTitle ?? null,
        });
        setPendingNudge({
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
        setPendingNudge({
          id: `nudge-perf-rp-${Date.now()}`,
          message,
          source: "performance",
        });
        return;
      }

      if (event.type === "module_completed") {
        if (engagementMode === "focused") return;
        setPendingNudge({
          id: `nudge-completion-${Date.now()}`,
          message: pickCompletionNudge(event.moduleTitle, event.nextModuleTitle ?? null),
          source: "completion",
        });
      }
    };

    const unsubscribe = subscribeEngagementEvents(handleEvent);

    // Listen to local DOM events too (for idle reset)
    const onDomActivity = () => resetIdle();
    const onScroll = () => {
      resetIdle();
      resetDwell();
    };

    window.addEventListener("keydown", onDomActivity);
    window.addEventListener("click", onDomActivity);
    window.addEventListener("scroll", onScroll, true);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resetIdle();
      } else {
        clearIdleTimer();
        clearDwellTimers();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", onDomActivity);
      window.removeEventListener("click", onDomActivity);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, engagementMode, engagementTimings, scheduleIdleTimer, scheduleDwellTimers]);

  const dismissNudge = useCallback(() => {
    setPendingNudge(null);
  }, []);

  return { pendingNudge, dismissNudge };
}
