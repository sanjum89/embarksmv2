
# Cohort Hub (Learner) — Plan

A new top-level learner surface that turns the lonely solo journey into a connected, motivating experience: where do I stand vs my cohort, who's my mentor, who can I learn with, what's coming up, and what should I do next.

## Goals
- Make the learner feel embedded in a cohort, not alone.
- One screen for: own progress, cohort comparison, mentor relationship, sessions (lead-led / peer / classroom), peer matches, study groups, announcements, activity, evidence, achievements, AI recommendations.
- All actions feel real but stay demo-safe (in-app modals, toasts, Action Centre logging).

## Entry point & route
- New top-level **"Cohort Hub"** sidebar item under the **Me** group in `AppSidebar.tsx`, between *Embark AI* and *My 360*. Icon: `Users` (lucide).
- Route: `/cohort-hub` registered in `App.tsx`. Page: `src/pages/CohortHub.tsx`.
- Replaces `CohortPreviewCard` link target in My 360 with a deep link to `/cohort-hub`.

## Data sources (read-only, existing tables)
| Block | Source |
|---|---|
| Active cohort, dates, code, due date | `cohort_enrollments` + `cohorts` for current learner |
| Module list & progress | `catalog_modules`, `learner_progress`, `catalog_chapters` (already powered by `useLearnerJourney`) |
| Cohort vs you (per module/track avg) | aggregate `learner_progress` across `cohort_enrollments.employee_id` of same `cohort_id` |
| Cohort leaderboard | same aggregate, sorted by completion % |
| Peer matches & "people learning similar topics" | other learners in same cohort, ranked by overlap of in-progress `module_code` and shared `topic_tags` |
| Mentor card | `mentor_assignments` where `mentee_employee_id = me`, joined to mentor employee |
| Pinned cohort announcements | new lightweight `cohort_announcements` table (see schema) |
| Live cohort activity | derived from recent `learner_progress` updates, `assessment_instances` completions, `mentor_assignments` inserts, `agent_one_events`; plus seeded mock entries for demo personas |
| Evidence captured | reflections (`reflections`), mentor feedback (`agent_one_events` with category=mentor), assessment scorecards (`assessment_instances`), session notes (mock for v1) |
| Achievements / badges | derived rules over `learner_analytics` + `assessment_instances` (e.g. *First quiz passed*, *5-day streak*, *Module 1 complete*); locked badges shown struck-through |
| Upcoming sessions, classroom/offline, study groups | new lightweight tables (see schema) — seeded for Rathbones cohort |
| AI recommendations | reuse Embark AI / `nudge_cards` filtered to recipient + cohort context; wire CTAs through `actionDispatch` so they auto-log to Action Centre |

## Schema additions (single migration)
Four small tables, all `account_id`-scoped with permissive RLS matching the rest of the app:

- `cohort_announcements` — `id, account_id, cohort_id, author_employee_id, body, posted_at, pinned bool`
- `cohort_sessions` — `id, account_id, cohort_id, kind('lead_led'|'peer'|'classroom'), title, description, host_employee_id, starts_at, duration_minutes, capacity, joined_count, teams_link text, location text nullable, tags text[]`
- `cohort_session_attendees` — `id, account_id, session_id, employee_id, status('joined'|'invited'|'declined')`
- `cohort_study_groups` — `id, account_id, cohort_id, title, focus, schedule_text, member_employee_ids text[], teams_link text`

No triggers; updated_at via existing `set_updated_at()` pattern.

## Page layout
3-zone editorial layout, scrolls vertically. Two visual modes (`Editorial` / `Cards`) toggled via segmented control in the header — same data, different density (Editorial = serif headings + generous spacing; Cards = compact tiles).

```text
┌────────────────────────────────────────────────────────────────┐
│ HEADER: avatar · cohort title · code · status badge · Editorial│
│         /Cards toggle                                          │
│ KPIs: %, projected, due, days left, rank, cohort code          │
│ Tags: chapter, next module gate                                │
├──────────────────────────────────┬─────────────────────────────┤
│ Cohort vs You (progress bars)    │ Your mentor (card)          │
│ Cohort leaderboard (top 4 + me)  │   Edward Whitfield          │
│                                  │   message · book session    │
│                                  │   next 1:1                  │
│                                  ├─────────────────────────────┤
│                                  │ Lead-led / Live             │
│                                  │ Open sessions list          │
├──────────────────────────────────┴─────────────────────────────┤
│ People learning similar topics │ Suggested peer matches │      │
│ + Connect                       │ + Connect              │ Up- │
│                                                          │coming│
│                                                          │sess. │
├────────────────────────────────────────────────────────────────┤
│ Mentor support · Classroom/offline sessions · Evidence capt.   │
├──────────────────────────────────┬─────────────────────────────┤
│ Self-organised study groups      │ PINNED: Cohort announcements│
│  (3 cards · Join group)          │ LIVE: Recent cohort activity│
├──────────────────────────────────┴─────────────────────────────┤
│ Achievements (badges)            │ Recommended actions (AI)    │
└────────────────────────────────────────────────────────────────┘
```

## Privacy posture
Per your call: full names + rank + % shown on leaderboard. We will:
- Cap leaderboard to top 4 + a "You · #N" pinned row to avoid an endless ranked list.
- Keep cohort-vs-you bars as **aggregate average only** (no per-person numbers in that block).
- Activity feed shows names but never raw scores ("Sofia completed CISI L4 mock paper · 82%" stays — that's the screenshot intent and you confirmed).

## Sessions & comms behaviour (v1)
Every "Join session", "Connect", "Message mentor", "Book session", "Join group" opens an **in-app modal** with:
- session/peer details, time, host, tags
- a `Copy Teams link` button (copies seeded `teams_link` to clipboard, toast confirmation)
- a primary `Confirm join` button → writes a row to `cohort_session_attendees` and logs an action to Action Centre via existing `actionDispatch`/Action Centre store.

No real Teams API calls in v1 (mentioned in tool-knowledge but kept out of scope to keep the demo deterministic).

## AI Recommended actions
Reuses the existing nudge surface:
- Pulls `nudge_cards` for the learner where `category` relates to cohort/mentor/peer.
- If empty, generates 3 contextual recs from a small client-side rules engine (e.g. *no 1:1 in 14 days → "Schedule 1:1 with mentor"*; *peer overlap > X → "Pair with a peer"*; *open lead-led session → "Join 'Deep dive: MiFID II'"*).
- Each rec auto-logs to Action Centre when executed.

## Demo determinism (Rathbones / Pinnacle)
- For Clara Wren (primary persona) and the other 8 Rathbones learners, seed a deterministic showcase via a new `src/data/cohortHubShowcase.ts`:
  - mentor = Edward Whitfield, next 1:1 Thu 14 May 10:30
  - 3 lead-led sessions (Margaret Atherton, Edward Whitfield) and 2 peer sessions
  - 3 study groups (Suitability Sprint, CISI L4 Mock Crew, Behavioural Lab)
  - 3 pinned announcements
  - leaderboard with the 9 Rathbones names + the live persona
  - "people learning similar topics" suggests Aisha Rahman, James O'Connor, Sofia Martinelli
- White-labelled automatically for Pinnacle Capital via `useContentSubstitution`.
- For non-Rathbones accounts: components fall back to whatever rows exist; if none, show empty-state CTAs ("Your cohort lead hasn't scheduled sessions yet").

## Files to create
- `src/pages/CohortHub.tsx` — page composition + scroll container
- `src/hooks/useCohortHub.ts` — assembles cohort, mentor, peers, sessions, announcements, leaderboard
- `src/lib/cohortHub/peerMatching.ts` — overlap-based peer ranking
- `src/lib/cohortHub/leaderboard.ts` — % completion aggregation + rank derivation
- `src/lib/cohortHub/achievements.ts` — rule-based badge derivation
- `src/data/cohortHubShowcase.ts` — Rathbones demo seed
- `src/components/cohort-hub/`
  - `CohortHeaderEditorial.tsx`, `CohortHeaderCards.tsx`, `ViewModeToggle.tsx`
  - `CohortVsYouCard.tsx`, `CohortLeaderboardCard.tsx`
  - `MentorCard.tsx`, `OpenSessionsCard.tsx`, `ClassroomSessionsCard.tsx`
  - `PeerMatchesCard.tsx`, `PeopleLearningSimilarCard.tsx`
  - `StudyGroupsCard.tsx`, `PinnedAnnouncementsCard.tsx`, `RecentActivityCard.tsx`
  - `EvidenceCapturedCard.tsx`, `AchievementsCard.tsx`, `RecommendedActionsCard.tsx`
  - `SessionDetailsDialog.tsx`, `ConnectDialog.tsx`, `MessageMentorDialog.tsx`, `JoinGroupDialog.tsx`

## Files to edit
- `src/App.tsx` — register `/cohort-hub`
- `src/components/layout/AppSidebar.tsx` — add **Cohort Hub** under Me
- `src/components/my360-v2/CohortPreviewCard.tsx` — link to `/cohort-hub`
- `src/components/team-home/MyCohortsCard.tsx` — link to `/cohort-hub` for learner side
- `mem://index.md` + new `mem://features/cohort-hub` entry

## Out of scope for v1
- Real MS Teams API calls (only copyable links)
- Creating new study groups / announcements from the learner UI (read + join only)
- Cross-cohort comparisons
- Evidence upload from this surface (links out to existing reflection/evidence pages)

## Risks / notes
- Performance: cohort-vs-you & leaderboard aggregate `learner_progress` across the cohort. We'll memoise per cohort and cap learner count read for v1 (cohorts are <50).
- Visual density is high — that's why the Editorial/Cards toggle exists; default to Editorial because it matches the brand voice in the screenshots.
- We're adding 4 small tables; all permissive RLS to match existing app posture (which already uses public access).
