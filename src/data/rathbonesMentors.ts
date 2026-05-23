/**
 * Single source of truth for Rathbones (and Pinnacle Capital white-label) mentor roster.
 *
 * Mentors live as virtual `rb-mentor-*` employee IDs in the `mentor_assignments` table.
 * Display metadata (name, title, reply window) is sourced from this file so every surface
 * — Cohort Hub, Action Centre seeds, Agent One chat prompt — references the same person.
 */

export interface RathbonesMentor {
  id: string;
  name: string;
  title: string;
  /** Plain-English phrase used in "X typically replies {replyWindow}." */
  replyWindow: string;
}

export const RATHBONES_MENTORS: Record<string, RathbonesMentor> = {
  "rb-mentor-1": {
    id: "rb-mentor-1",
    name: "Margaret Atherton",
    title: "Embark Mentor — Wealth Strategy",
    replyWindow: "within a few hours",
  },
  "rb-mentor-2": {
    id: "rb-mentor-2",
    name: "Henry Caldwell",
    title: "Senior IM — Discretionary Portfolios",
    replyWindow: "the same day",
  },
  "rb-mentor-3": {
    id: "rb-mentor-3",
    name: "Diana Pemberton",
    title: "Head of Suitability & Consumer Duty",
    replyWindow: "within a day",
  },
  "rb-mentor-4": {
    id: "rb-mentor-4",
    name: "Alistair Quinn",
    title: "Investment Director — Private Clients",
    replyWindow: "within a day",
  },
};

/** Canonical learner → mentor mapping for all 9 Rathbones personas. */
export const LEARNER_MENTOR_MAP: Record<string, string> = {
  "rb-l1": "rb-mentor-1",
  "rb-l2": "rb-mentor-1",
  "rb-l3": "rb-mentor-2",
  "rb-l4": "rb-mentor-2",
  "rb-l5": "rb-mentor-3",
  "rb-l6": "rb-mentor-1",
  "rb-l7": "rb-mentor-3",
  "rb-l8": "rb-mentor-4",
  "rb-l9": "rb-mentor-4",
};

export function getMentorFor(employeeId: string | null | undefined): RathbonesMentor | null {
  if (!employeeId) return null;
  const mentorId = LEARNER_MENTOR_MAP[employeeId];
  return mentorId ? RATHBONES_MENTORS[mentorId] ?? null : null;
}

export function getMentorById(mentorId: string | null | undefined): RathbonesMentor | null {
  if (!mentorId) return null;
  return RATHBONES_MENTORS[mentorId] ?? null;
}
