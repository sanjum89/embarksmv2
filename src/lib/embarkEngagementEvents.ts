// Lightweight event emitter for Embark AI engagement signals
// (assessment completed, role play completed, module completed, scroll activity).

export type EngagementEvent =
  | {
      type: "assessment_completed";
      score: number; // 0-100
      moduleId?: string | null;
      moduleTitle?: string | null;
    }
  | {
      type: "role_play_completed";
      rating: number; // 1-5
      scenarioTitle?: string | null;
    }
  | {
      type: "module_completed";
      moduleTitle: string;
      nextModuleTitle?: string | null;
    }
  | {
      type: "user_activity";
      kind: "scroll" | "click" | "keydown" | "mousemove";
    }
  | {
      type: "retention_gap_detected";
      weakTopics: string[];
      score: number;
      assessmentTitle?: string | null;
      skillTargetId?: string | null;
    }
  | {
      type: "module_reopened";
      moduleTitle: string;
      skillTargetId?: string | null;
    }
  | {
      type: "refresher_passed";
      topic: string;
    }
  | {
      type: "struggling_streak";
      consecutiveLowScores: number;
    };

type Listener = (event: EngagementEvent) => void;

const listeners = new Set<Listener>();

export function emitEngagementEvent(event: EngagementEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.error("[embarkEngagement] listener error", err);
    }
  });
}

export function subscribeEngagementEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
