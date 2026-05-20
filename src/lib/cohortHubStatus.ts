import type { CohortHubData } from "@/hooks/useCohortHub";

export type CohortStatusTone = "attention" | "action" | "milestone" | "ontrack";

export interface CohortStatus {
  tone: CohortStatusTone;
  label: string;        // short pill label
  headline: string;     // one-line reason
  cta?: { label: string; to?: string; onClick?: () => void };
}

function hoursUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return (new Date(iso).getTime() - Date.now()) / 3600000;
}

export function cohortAvgPct(data: CohortHubData): number {
  const xs = data.moduleProgress.map((m) => m.cohortAvgPct).filter((n) => typeof n === "number");
  if (xs.length === 0) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

export function deriveHubStatus(data: CohortHubData): CohortStatus {
  const avg = cohortAvgPct(data);
  const gap = avg - data.yourPct;

  // Priority 1 — attention (falling behind OR deadline near)
  if (gap >= 10) {
    const focus = data.moduleProgress
      .slice()
      .sort((a, b) => (b.cohortAvgPct - b.youPct) - (a.cohortAvgPct - a.youPct))[0];
    return {
      tone: "attention",
      label: "Needs attention",
      headline: focus
        ? `You're ${gap}% below cohort average — ${focus.trackName} is the biggest gap.`
        : `You're ${gap}% below cohort average.`,
      cta: { label: "Continue learning", to: "/" },
    };
  }
  if (data.daysLeft > 0 && data.daysLeft <= 14) {
    return {
      tone: "attention",
      label: "Deadline near",
      headline: `Cohort closes in ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"} — ${data.yourPct}% complete.`,
      cta: { label: "Continue learning", to: "/" },
    };
  }

  // Priority 2 — action due (mentor 1:1 within 7d, or session within 48h)
  const mentorH = hoursUntil(data.mentor?.nextOneOnOneAt);
  if (mentorH != null && mentorH >= 0 && mentorH <= 24 * 7) {
    const days = Math.max(1, Math.round(mentorH / 24));
    return {
      tone: "action",
      label: "Upcoming 1:1",
      headline: `1:1 with ${data.mentor!.name} in ${days} day${days === 1 ? "" : "s"} — prep your reflection.`,
      cta: { label: "Open mentor", to: "#mentor" },
    };
  }
  const nextSession = data.upcomingSessions[0];
  const sessionH = hoursUntil(nextSession?.startsAt);
  if (sessionH != null && sessionH >= 0 && sessionH <= 48) {
    const when = sessionH < 24 ? `${Math.max(1, Math.round(sessionH))}h` : "tomorrow";
    return {
      tone: "action",
      label: "Session soon",
      headline: `${nextSession!.title} in ${when}.`,
      cta: { label: "View session", to: "#sessions" },
    };
  }

  // Priority 3 — milestone (close to a gate)
  if (data.nextModuleGate) {
    const nearGate = data.moduleProgress.find((m) => m.youPct >= 80 && m.youPct < 100);
    if (nearGate) {
      return {
        tone: "milestone",
        label: "Milestone close",
        headline: `Almost at ${data.nextModuleGate.replace(/^MODULE GATE \d+\s*—\s*/i, "")} — ${100 - nearGate.youPct}% to go.`,
        cta: { label: "Continue learning", to: "/" },
      };
    }
  }

  // Default — on track
  return {
    tone: "ontrack",
    label: "On track",
    headline: data.daysLeft > 0
      ? `You're at ${data.yourPct}% with ${data.daysLeft} days until the cohort closes.`
      : `You're at ${data.yourPct}%.`,
    cta: { label: "Continue learning", to: "/" },
  };
}
