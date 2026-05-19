/**
 * Hand-written narrative copy for the 9 Rathbones learner personas.
 * Numbers (progress %, scores, micro_learnings) come from DB signals.
 * This file holds only the *why-this-status* story a manager would want to read.
 *
 * Keyed by employee_id (rb-l1..rb-l9). Returns null for non-Rathbones IDs so
 * other accounts continue to flow through the legacy overlay path unchanged.
 *
 * ⚠️ Persona ↔ employee_id mapping (must stay in sync with
 *    `src/data/managerDemoOverlay.ts` and seed data):
 *     rb-l1 Sophie Linden     · rb-l2 Maya Holloway     · rb-l3 Theo Marchant
 *     rb-l4 Owen Castell      · rb-l5 Priya Aldridge    · rb-l6 Clara Wren
 *     rb-l7 Rosa Belmont      · rb-l8 Felix Arden       · rb-l9 Elliot Hayes
 *
 *    Each `story` paragraph references the persona's first name explicitly,
 *    and the guard test `rathbonesNarrative.test.ts` asserts it. If you
 *    re-shuffle persona IDs, update BOTH the keys here AND the names in the
 *    prose, or the test will fail.
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

/** First name expected to appear in NARRATIVES[id].story. Drift guard. */
export const NARRATIVE_OWNER_NAMES: Record<string, string> = {
  "rb-l1": "Sophie",
  "rb-l2": "Maya",
  "rb-l3": "Theo",
  "rb-l4": "Owen",
  "rb-l5": "Priya",
  "rb-l6": "Clara",
  "rb-l7": "Rosa",
  "rb-l8": "Felix",
  "rb-l9": "Elliot",
};

const NARRATIVES: Record<string, PersonaNarrative> = {
  "rb-l1": {
    employeeId: "rb-l1",
    headline: "New joiner — outside FS, full foundation path queued.",
    story:
      "Sophie joined two weeks ago from outside financial services and is working through the full Foundations track. Pace is deliberate but steady — one chapter every two days, no missed assessments yet. Worth a light-touch check-in once she hits the first midpoint.",
    aiRationale:
      "No remediation injected; standard full-path delivery. Status held at on-track because pace is within cohort norm and no assessments have failed.",
  },
  "rb-l2": {
    employeeId: "rb-l2",
    headline: "On track — strong start on bk1, evidence task submitted.",
    story:
      "Maya is three modules in and scoring 82–86 on every post-module assessment. She submitted her first client-suitability evidence task on time and her manager flagged it as a clear pass. No micro-learnings outstanding, no idle gaps — she is exactly where the cohort median sits.",
    aiRationale:
      "Pace and scores are inside the on-track band; no failed attempts, no pending micros, last activity within 48h. Nothing to action.",
  },
  "rb-l3": {
    employeeId: "rb-l3",
    headline: "At risk — two failed assessments, 6-day idle gap last week.",
    story:
      "Theo passed bk1 at 78 but failed the midpoint on bk2 at 62 — three KYC chapters were re-opened and he retook to 81. The Charles River diagnostic scored 40, re-opening five chapters of which he has completed two. His AML assessment failed at 55, producing four pending micro-learnings he has not yet started. Last activity was six days ago.",
    aiRationale:
      "Failed attempts ≥ 2 and idle > 5 days both trip the at-risk rule. Micro-learnings and reopened chapters were injected automatically; manager should consider a 1:1 before the next assessment window.",
  },
  "rb-l4": {
    employeeId: "rb-l4",
    headline: "On track — career-switcher leaning on case studies.",
    story:
      "Owen brings senior consulting experience but is new to IM, so the path keeps the full Foundations track with extra case-study emphasis. He is three of eight modules in at 79–84 on every assessment with no fails. Pace matches cohort median.",
    aiRationale:
      "Standard delivery with case-study emphasis on Foundations. No remediation needed; manager touchpoint suggested at the foundation midpoint.",
  },
  "rb-l5": {
    employeeId: "rb-l5",
    headline: "Needs check-in — pass with gaps on tk1, two micros open.",
    story:
      "Priya cleared all five Business Knowledge modules without incident, then scored 76 on the Charles River assessment — just above the 70% pass. The 24% she missed generated two pending micro-learnings on order workflow and compliance checks, both untouched for four days. She also raised a hand on tk2 Bloomberg Essentials asking for a walkthrough.",
    aiRationale:
      "Pending micro-learnings ≥ 1 with recent activity within seven days. Status held at needs-check-in rather than at-risk because no assessment has been failed and pace is steady.",
  },
  "rb-l6": {
    employeeId: "rb-l6",
    headline: "Rising star — pacing 25% ahead of cohort, stretch unlocked.",
    story:
      "Clara has cleared the entire Business Knowledge track and four of seven Technical Knowledge modules with assessment scores between 92 and 100. She unlocked the stretch module 'Leading a Client Review End-to-End' last week and started chapter one the same evening. One 88% on Performance Attribution generated a single targeted micro-learning on attribution drift — already queued in her path.",
    aiRationale:
      "Pace > p75 across all tracks, zero failed attempts, and stretch enrolment together meet the rising-star threshold. No remediation injected; one micro-learning auto-added from the 12% she missed on the Performance Attribution assessment.",
  },
  "rb-l7": {
    employeeId: "rb-l7",
    headline: "Needs check-in — senior hire flagged foundations as too basic.",
    story:
      "Rosa is a senior hire from product management. AI assigned a domain-bridge variant with diagnostic-only on the first foundation module (she scored 76). Her latest reflection said the content still 'feels too 101' — worth tailoring further before she disengages. No fails, no pending micros, but only two sessions in the last seven days.",
    aiRationale:
      "Reflection signal trips the needs-check-in rule even though scores are passing. Recommend converting more foundation modules to diagnostic-only and surfacing stretch content earlier.",
  },
  "rb-l8": {
    employeeId: "rb-l8",
    headline: "On track — experienced banker, mostly diagnostic-only.",
    story:
      "Felix has 10y FS experience, so AI converted four foundation modules to diagnostic-only and he passed all of them at 84–90. He is now producing real client-suitability work as evidence on the Technical track. Steady cadence, no remediation, evidence pipeline is the strongest in the cohort.",
    aiRationale:
      "Diagnostic-only path is working as intended; no failed attempts, evidence submissions ahead of schedule. Nothing to action.",
  },
  "rb-l9": {
    employeeId: "rb-l9",
    headline: "Rising star — readiness gate approaching, foundations compressed.",
    story:
      "Elliot has 8y IM experience. AI compressed five foundation modules into skip-after-validation or diagnostic-only and he scored 90–96 across all of them. He is now five of eight chapters into Portfolio Construction with zero fails, zero reopens and no idle gaps. Tracking to hit the readiness gate next week.",
    aiRationale:
      "Meets the rising-star pace + zero-fail criteria; compressed path freed up time so he is two weeks ahead of cohort median. Manager should approve for the readiness gate review.",
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

/** Exposed for the drift-guard test. */
export const __NARRATIVES_FOR_TEST = NARRATIVES;
