/**
 * Hand-written narrative copy for the 9 Rathbones learner personas.
 * Numbers (progress %, scores, micro_learnings) come from DB signals.
 * This file holds only the *why-this-status* story manager would want to read.
 *
 * Keyed by employee_id (rb-l1..rb-l9). Returns null for non-Rathbones IDs so
 * other accounts continue to flow through the legacy overlay path unchanged.
 */

import type { LearnerStatus } from "@/data/managerDemoOverlay";

export interface PersonaNarrative {
  employeeId: string;
  /** Single-line summary used in roster row + drawer hero subtitle. */
  headline: string;
  /** Two- to three-sentence paragraph: why this status, what changed, what's next. */
  story: string;
  /** Manager-facing rationale used by the AI Changes Feed when DB has no path changes. */
  aiRationale?: string;
  /** Override status if narrative diverges from rule-derived status (e.g. emerging stars). */
  statusOverride?: LearnerStatus;
}

const NARRATIVES: Record<string, PersonaNarrative> = {
  "rb-l3": {
    employeeId: "rb-l3",
    headline: "Rising star — pacing 25% ahead of cohort, stretch unlocked.",
    story:
      "Clara has cleared the entire Business Knowledge track and four of seven Technical Knowledge modules with assessment scores between 92 and 100. She unlocked the stretch module 'Leading a Client Review End-to-End' last week and started chapter one the same evening. One 88% on Performance Attribution generated a single targeted micro-learning on attribution drift — already queued in her path.",
    aiRationale:
      "Pace > p75 across all tracks, zero failed attempts, and stretch enrolment together meet the rising-star threshold. No remediation injected; one micro-learning auto-added from the 12% she missed on the Performance Attribution assessment.",
  },
  "rb-l2": {
    employeeId: "rb-l2",
    headline: "At risk — two failed assessments, 12-day idle gap last week.",
    story:
      "Theo passed bk1 at 78 but failed the midpoint on bk2 at 62 — three KYC chapters were re-opened and he retook to 81. The Charles River diagnostic scored 40, re-opening five chapters of which he has completed two. His AML assessment failed at 55, producing four pending micro-learnings he has not yet started. Last activity was six days ago.",
    aiRationale:
      "Failed attempts ≥ 2 and idle > 5 days both trip the at-risk rule. Micro-learnings and reopened chapters were injected automatically; manager should consider a 1:1 before the next assessment window.",
  },
  "rb-l5": {
    employeeId: "rb-l5",
    headline: "Needs check-in — pass with gaps on tk1, two micros open.",
    story:
      "Beth cleared all five Business Knowledge modules without incident, then scored 76 on the Charles River assessment — just above the 70% pass. The 24% she missed generated two pending micro-learnings on order workflow and compliance checks, both untouched for four days. She also raised a hand on tk2 Bloomberg Essentials asking for a walkthrough.",
    aiRationale:
      "Pending micro-learnings ≥ 1 with recent activity within seven days. Status held at needs-check-in rather than at-risk because no assessment has been failed and pace is steady.",
  },
  "rb-l7": {
    employeeId: "rb-l7",
    headline: "Rising star (emerging) — four weeks in, top-decile pace, zero fails.",
    story:
      "Kofi has worked through bk1 to bk3 at 90%+ on every assessment and is five of eight chapters into Portfolio Construction. No micro-learnings, no reopens, no idle gaps. He is not yet eligible for the stretch track but is tracking to clear the foundation track two weeks ahead of the cohort median.",
    aiRationale:
      "Meets the rising-star pace + zero-fail criteria. Stretch not yet unlocked (requires foundation track completion), so flagged as emerging — worth a stretch conversation in the next 1:1.",
    statusOverride: "rising_star",
  },
};

export function getRathbonesNarrative(employeeId: string | null | undefined): PersonaNarrative | null {
  if (!employeeId) return null;
  return NARRATIVES[employeeId] ?? null;
}

export function hasRathbonesNarrative(employeeId: string | null | undefined): boolean {
  return !!employeeId && employeeId in NARRATIVES;
}
