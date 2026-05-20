# Cohort Hub — Reorganisation + Adapted Learning Path tab

## Goal
Cut clutter, surface decisions above the fold, group like with like, and add a dedicated **Adapted Learning Path** tab that makes the system's personalisation visible to the learner.

## New page layout

```text
┌──────────────────────────────────────────────────────────────┐
│ PageHeader                                                   │
│ Tabs:  Overview · Adapted path                               │
├──────────────────────────────────────────┬───────────────────┤
│ STATUS BANNER (deterministic, full-w)    │                   │
├──────────────────────────────────┬───────┤   RIGHT RAIL      │
│ KPI tiles (4)                    │ RECO  │   (sticky on lg)  │
│  progress · time · now · next    │ NEXT  │   ── Pinned ──    │
│                                  │ acts  │   Announcements   │
├──────────────────────────────────┴───────┤   ── Live ──      │
│ Cohort vs you · progress by module       │   Recent activity │
├──────────────────────────────────────────┤                   │
│ Achievements                             │                   │
├──────────────────────────────────────────┤                   │
│ CO-LEARNING TIMELINE (unified)           │                   │
├──────────────────────────────────────────┤                   │
│ People to connect with (unified)         │                   │
├──────────────────────────────────────────┤                   │
│ Leaderboard · Mentor · Evidence          │                   │
└──────────────────────────────────────────┴───────────────────┘
```

`lg+`: 2-column `grid-cols-[2fr_1fr]`, rail `sticky top-20`. `<lg`: rail collapses below main.

## Section changes (Overview tab)

1. **Above the fold** — status banner full-width, then a row with 4 KPI tiles (`col-span-2`) + Recommended actions (`col-span-1`).
2. **Co-learning timeline** — merges Open sessions + Classroom/offline + Study groups into one chronological list grouped by "This week / Next week / Earlier", each row with a type chip (`LIVE` / `CLASSROOM` / `STUDY GROUP`). Optional filter chips: `All · Live · Classroom · Study groups`.
3. **People to connect with** — merges People learning similar topics + Peer matches into one deduped list (by `employeeId`), each row carries a reason chip (`Similar topic: MiFID II` / `Suggested match: complementary skills`).
4. **Right rail** — Cohort announcements (top) + Recent activity (below, capped at 6 + View all), `sticky` on `lg+`.
5. Leaderboard / Mentor / Evidence kept as one 3-up row at the bottom of main col.

## New: Adapted Learning Path tab

A top-level tab inside Cohort Hub (Radix `Tabs`, default `overview`) called **"Adapted path"**. It tells the learner *how* the system has tailored their journey for them — not just where they are.

### Layout

```text
HEADER STRIP  ── one-line AI-style summary
  e.g. "Your path is condensed by 3 modules and adds a portfolio role play
        in week 4. 2 baseline diagnostics, 4 chapter checks, 1 final
        assessment ahead."

LEGEND CHIPS  Condensed · Micro-learning · Skip-after-validation · Added · Standard
              Baseline · Diagnostic · Adhoc check · Role play · Final

PATH RAIL (vertical timeline per track)
  Track: Business Knowledge
    ●─── Module: Intro to Wealth                     [STANDARD]   45 min
    ●─── Module: Compliance                          [CONDENSED]  reason chip
         ▸ Baseline diagnostic (5 Q, 8 min)         skipped — already validated
         ▸ Chapter check (3 Q)
    ●─── Role play: Suitability conversation        [ADDED]      manager note
    ●─── Module: MiFID II                            [MICRO]      condensed reason
         ▸ Final assessment (CISI L4 mock)
  Track: Behavioural Skills
    ...
```

Each node renders:
- icon by content kind (module / role play / assessment)
- adaptation badge + reason text (`reason` from `persona_module_adaptations`)
- assessment-type chip when present (`Baseline` / `Diagnostic` / `Chapter check` / `Adhoc` / `Final`)
- duration estimate
- "Why this?" popover showing competency name, your current level, required level, validation-needed flag, manager note

### Data sources (all already exist)

- `useLearnerJourney(accountId, employeeId)` — returns tracks → modules → chapters, each module already carries `adaptation: ModuleAdaptation { adaptationType, reason, visibleToLearner, managerNote, competencyName, currentLevel, requiredLevel, validationNeeded, riskCritical }`.
- `assessmentScore`, `assessmentPassed`, `assessmentPassingScore` already on `JourneyChapter` for outcome chips.
- Assessment **type** (baseline / diagnostic / chapter / adhoc / final) inferred from `catalog_chapters.content_type` + position in module (first → baseline, mid → chapter check, last & module-summative → final). Add a small helper `classifyAssessment(chapter, module)` in `src/lib/adaptedPath.ts` returning `"baseline" | "diagnostic" | "chapter" | "adhoc" | "final"`.
- `adaptationType` mapped to legend chip:
  - `condense` → Condensed
  - `micro` → Micro-learning
  - `skip_after_validation` → Skip-after-validation
  - `add_practice` → Added
  - (none) → Standard

### Header summary

Compute locally from journey: count of `condense` + `micro` + `skip_after_validation` modules, count of added role plays, count of upcoming assessments by type. One line, no LLM call.

### Files

- `src/pages/CohortHub.tsx` — wrap body in `<Tabs>` with `overview` and `adapted-path` triggers; restructure Overview as above.
- **New** `src/components/cohort/CoLearningTimeline.tsx` — normalises `{ upcomingSessions, classroomSessions, studyGroups }` into `TimelineItem[]`, sorts by date, groups by week bucket.
- **New** `src/components/cohort/PeopleToConnect.tsx` — merges `peopleSimilar` + `peerMatches`, dedupes by `employeeId`, renders reason chips.
- **New** `src/components/cohort/CohortRightRail.tsx` — sticky wrapper for announcements + activity.
- **New** `src/components/cohort/AdaptedPathTab.tsx` — consumes `useLearnerJourney`, renders header summary + legend + per-track vertical timeline.
- **New** `src/lib/adaptedPath.ts` — `classifyAssessment(chapter, module)`, `summariseAdaptations(journey)`.
- No changes to `useCohortHub`, `useLearnerJourney`, DB, or edge functions.

## Technical notes

- Tabs persist selection in URL (`?tab=adapted-path`) via `useSearchParams` for shareable deep links.
- All colors via semantic tokens. Adaptation chips reuse `Badge` variants; assessment-type chips use `outline` + small dot color (semantic only).
- Right rail uses `lg:sticky lg:top-20 lg:self-start`; on mobile it stacks below main.
- Adapted path vertical timeline reuses the visual pattern from `src/components/skill-target/StepTimeline.tsx` (left rail dot + connector line).
- Empty states: if a learner has no adaptations, Adapted path renders "Your path is the cohort standard — no personalisations yet." plus the same timeline with all nodes labelled `Standard`.

## Out of scope
- Status banner logic (kept as-is from `cohortHubStatus.ts`).
- Module progress, Achievements, Mentor card content.
- Any backend, schema, or analytics changes.
- No LLM calls; the summary line is computed from journey counts.
