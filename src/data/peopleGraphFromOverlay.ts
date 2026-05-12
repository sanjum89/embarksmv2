/**
 * Adapter: turn the manager demo overlay (the same data source feeding Team Home
 * and the Cohort Hub) into the shapes People Graph's Employee Signal Explorer
 * expects. Keeps demo storytelling consistent across screens.
 */
import type { LearnerOverlay, ModuleCellOverlay } from "./managerDemoOverlay";
import { COHORT_MODULES_FALLBACK } from "./managerDemoOverlay";
import type {
  EmployeeLabelReasoning,
  EmployeeReflectionAnalysis,
} from "./peopleGraphSystems";

const STATUS_LABEL: Record<
  LearnerOverlay["status"],
  { label: string; severity: EmployeeLabelReasoning["severity"]; formula: string; confidence: number }
> = {
  at_risk: {
    label: "At Risk — Needs Coaching",
    severity: "critical",
    formula: "assessment_failures >= 2 OR (cpd_progress < 0.4 AND raised_hand_count > 0)",
    confidence: 0.84,
  },
  needs_check_in: {
    label: "Needs Check-in",
    severity: "warning",
    formula: "pace_delta_days >= 2 AND assessment_avg >= 70",
    confidence: 0.72,
  },
  rising_star: {
    label: "Rising Star",
    severity: "success",
    formula: "assessment_avg > 88 AND learning_velocity > 2.0 AND role_play_score > 80",
    confidence: 0.91,
  },
  on_track: {
    label: "On Track",
    severity: "info",
    formula: "no_critical_flags AND pace_delta_days <= 1 AND assessment_avg >= 75",
    confidence: 0.78,
  },
};

const moduleTitleByCode = (code: string) =>
  COHORT_MODULES_FALLBACK.find((m) => m.module_code === code)?.module_title ?? code;

function scoreSignals(cells: ModuleCellOverlay[]) {
  return cells
    .filter((c) => typeof c.score === "number")
    .map((c) => ({
      source: "Learning Platform",
      signal: `${moduleTitleByCode(c.module_code)} assessment`,
      value: `${c.score}%`,
      weight: 0.2,
      direction:
        (c.score ?? 0) >= 80 ? "positive" : (c.score ?? 0) >= 70 ? "neutral" : "negative",
    })) as EmployeeLabelReasoning["contributingSignals"];
}

function progressSignal(cells: ModuleCellOverlay[]): EmployeeLabelReasoning["contributingSignals"][number] {
  const completed = cells.filter((c) => c.status === "completed").length;
  const inProg = cells.filter((c) => c.status === "in_progress").length;
  return {
    source: "Cohort Tracker",
    signal: "Modules completed",
    value: `${completed}/${cells.length}${inProg ? ` (+${inProg} in progress)` : ""}`,
    weight: 0.15,
    direction: completed / cells.length >= 0.5 ? "positive" : "neutral",
  };
}

function cpdSignal(cpd: LearnerOverlay["cpd"]): EmployeeLabelReasoning["contributingSignals"][number] {
  const ratio = cpd.hours_logged / Math.max(cpd.hours_required, 1);
  return {
    source: "CPD Tracker",
    signal: "Hours logged vs required",
    value: `${cpd.hours_logged}/${cpd.hours_required}h`,
    weight: 0.15,
    direction: ratio >= 0.5 ? "positive" : ratio >= 0.25 ? "neutral" : "negative",
  };
}

export function buildOverlayLabels(overlay: LearnerOverlay): EmployeeLabelReasoning[] {
  const labels: EmployeeLabelReasoning[] = [];
  const base = STATUS_LABEL[overlay.status];

  // Primary status label
  const scores = scoreSignals(overlay.cells).slice(0, 3);
  const baseSignals: EmployeeLabelReasoning["contributingSignals"] = [
    progressSignal(overlay.cells),
    cpdSignal(overlay.cpd),
    ...scores,
  ];
  if (overlay.rolePlays[0]) {
    baseSignals.push({
      source: "Role Play Simulator",
      signal: overlay.rolePlays[0].title,
      value: `${overlay.rolePlays[0].score}%`,
      weight: 0.15,
      direction: overlay.rolePlays[0].score >= 75 ? "positive" : "negative",
    });
  }
  labels.push({
    label: base.label,
    severity: base.severity,
    formula: base.formula,
    confidence: base.confidence,
    contributingSignals: baseSignals,
    thresholds: [
      { metric: "Assessment avg", threshold: "≥ 75%", actual: avgScore(overlay.cells) },
      { metric: "CPD progress", threshold: "≥ 50% by mid-year", actual: cpdActual(overlay.cpd) },
      { metric: "Pace", threshold: "within 1 day of cohort", actual: paceActual(overlay) },
    ],
  });

  // Adaptive path label
  const microPath = overlay.pathChanges.find((p) => p.kind === "microlearning");
  const skipPath = overlay.pathChanges.find((p) => p.kind === "skipped" || p.kind === "diagnostic_only");
  if (microPath || skipPath) {
    const p = microPath ?? skipPath!;
    labels.push({
      label: microPath ? "Adaptive Microlearning Active" : "Foundation Skip Approved",
      severity: "info",
      formula:
        p.kind === "microlearning"
          ? "failed_attempts >= 2 AND weak_tag_detected"
          : "prior_experience_signal AND diagnostic_pass >= 80",
      confidence: p.confidence === "high" ? 0.9 : p.confidence === "medium" ? 0.7 : 0.5,
      contributingSignals: [
        {
          source: "AI Path Engine",
          signal: p.module_title,
          value: p.kind,
          weight: 0.5,
          direction: "neutral",
        },
        ...p.evidence.slice(0, 3).map((e) => ({
          source: "Evidence",
          signal: e,
          value: "✓",
          weight: 0.15,
          direction: "neutral" as const,
        })),
      ],
      thresholds: [
        { metric: "Confidence", threshold: "≥ medium", actual: p.confidence },
        { metric: "Risk", threshold: "≤ medium", actual: p.risk },
        { metric: "Approval", threshold: "manager review", actual: p.needs_approval ? "pending" : "auto" },
      ],
    });
  }

  // Hand raised
  const hand = overlay.actions.find((a) => a.group === "raised_hand");
  if (hand) {
    labels.push({
      label: "Hand Raised",
      severity: "warning",
      formula: "learner_initiated_help_request AND unresolved_age > 0",
      confidence: 0.95,
      contributingSignals: [
        {
          source: "Reflections Engine",
          signal: `Hand raised on ${hand.module_title ?? "module"}`,
          value: hand.age,
          weight: 0.6,
          direction: "negative",
        },
        {
          source: "Learner message",
          signal: hand.detail,
          value: "verbatim",
          weight: 0.4,
          direction: "neutral",
        },
      ],
      thresholds: [
        { metric: "Severity", threshold: "auto-route to manager", actual: hand.severity },
        { metric: "Age", threshold: "< 24h", actual: hand.age },
        { metric: "Source", threshold: "learner-initiated", actual: "yes" },
      ],
    });
  }

  // CPD warning (only if status itself isn't already at_risk)
  if ((overlay.cpd.status === "at_risk" || overlay.cpd.status === "overdue") && overlay.status !== "at_risk") {
    labels.push({
      label: "CPD Behind Plan",
      severity: "warning",
      formula: "hours_logged / hours_required < 0.5 AND month >= mid_year",
      confidence: 0.82,
      contributingSignals: [
        cpdSignal(overlay.cpd),
        {
          source: "CPD Tracker",
          signal: "Evidence items submitted",
          value: overlay.cpd.evidence_count,
          weight: 0.3,
          direction: overlay.cpd.evidence_count >= 3 ? "positive" : "negative",
        },
      ],
      thresholds: [
        { metric: "CPD ratio", threshold: "≥ 0.5", actual: cpdActual(overlay.cpd) },
        { metric: "Status", threshold: "on_track", actual: overlay.cpd.status },
      ],
    });
  }

  return labels;
}

function avgScore(cells: ModuleCellOverlay[]): string {
  const s = cells.map((c) => c.score).filter((v): v is number => typeof v === "number");
  if (!s.length) return "n/a";
  return `${Math.round(s.reduce((a, b) => a + b, 0) / s.length)}%`;
}
function cpdActual(cpd: LearnerOverlay["cpd"]): string {
  return `${Math.round((cpd.hours_logged / Math.max(cpd.hours_required, 1)) * 100)}%`;
}
function paceActual(o: LearnerOverlay): string {
  const completed = o.cells.filter((c) => c.status === "completed").length;
  return `${completed}/${o.cells.length} done`;
}

export function buildOverlayReflections(overlay: LearnerOverlay): EmployeeReflectionAnalysis[] {
  if (!overlay.reflections.length) return [];

  const sentimentFor = (status: LearnerOverlay["status"]): "positive" | "neutral" | "negative" =>
    status === "rising_star" ? "positive" : status === "at_risk" || status === "needs_check_in" ? "negative" : "neutral";

  const themesFor = (): string[] => {
    const t = new Set<string>();
    overlay.actions.forEach((a) => t.add(a.group.replace(/_/g, "-")));
    overlay.pathChanges.forEach((p) => t.add(p.kind));
    if (overlay.cpd.status !== "on_track") t.add("cpd-" + overlay.cpd.status);
    return Array.from(t).slice(0, 5);
  };

  const skills = (() => {
    const out: { skill: string; proficiency: string; confidence: number }[] = [];
    overlay.pathChanges.forEach((p) => {
      out.push({
        skill: p.module_title,
        proficiency:
          p.kind === "microlearning" ? "Foundational" : p.kind === "diagnostic_only" ? "Proficient" : "Developing",
        confidence: p.confidence === "high" ? 0.85 : p.confidence === "medium" ? 0.65 : 0.45,
      });
    });
    overlay.rolePlays.forEach((rp) =>
      rp.behaviours.forEach((b) =>
        out.push({ skill: b, proficiency: rp.score >= 80 ? "Proficient" : "Developing", confidence: rp.score / 100 })
      )
    );
    return out.slice(0, 4);
  })();

  const concerns = overlay.actions
    .filter((a) => a.group !== "raised_hand")
    .slice(0, 3)
    .map((a) => ({
      topic: a.title,
      severity: a.severity,
      suggestedAction: a.detail,
    }));

  const handAction = overlay.actions.find((a) => a.group === "raised_hand");
  if (handAction) {
    concerns.unshift({
      topic: `Raised hand: ${handAction.module_title ?? "module"}`,
      severity: handAction.severity,
      suggestedAction: "Schedule a 1-on-1 to unblock the learner",
    });
  }

  return overlay.reflections.map((r, idx) => ({
    id: `pg-${overlay.employeeId}-${r.id}`,
    date: r.submitted_at.slice(0, 10),
    summary: r.summary,
    extractedSkills: idx === 0 ? skills : [],
    sentiment: sentimentFor(overlay.status),
    concerns: idx === 0 ? concerns : [],
    themes: themesFor(),
  }));
}
