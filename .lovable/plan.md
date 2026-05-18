
# Unify manager dashboard with real learner cohort data

## Goal

Flip the data direction: real cohort modules + real adaptive rules become the source of truth. Clara (rising star) and Theo (at risk) are seeded by *actually running* them through the 29 `assoc_im` modules under the rules, so the manager dashboard and the learner experience show the same reality. Narrative copy stays in code, keyed to the same persona spec that seeds the DB.

## Phase 1 — Port two adaptive rules onto the cohort path

Today the cohort path supports: per-chapter `learner_progress`, `chapter_lock_events`, `persona_module_adaptations`, and Quick Diagnostic (`learner_progress` row `chapter_code='__diag'` with `wrong_chapters` → drives `diagnosticReopens`).

**Rule A — Post-assessment microlearning for the missed slice**
- Hook in `LearnPathContent.tsx` after an `assessment_instances` row is finalised.
- For every wrong question, insert a `micro_learnings` row scoped to `(employee_id, cohort_id, source_assessment_id)` with `failed_question`, `learner_answer`, `correct_answer`, derived `why_wrong`, `teaching_content_outline`, `practical_activity`, `chapters[]` mapped via `catalog_chapters.topic_tags` ∩ question.tags.
- Triggered whenever score < 100 (covers the "got 80%, micro the 20%" case and the hard-fail case).

**Rule B — Midpoint-fail reopens previous chapters in the same module**
- Same hook, only when `catalog_assessment_blueprints.scope = 'midpoint'` and score < `passing_score`.
- Find chapters in the same module that taught the wrong topic tags; write `chapter_lock_events` rows with `unlocked_at = null`, `reason = 'reopened_for_midpoint_remediation'`; reset matching `learner_progress` to `in_progress`. `useLearnerJourney` already honours `chapter_lock_events`.
- Reopening across *previous modules* is explicitly out of scope.

Shared helper `src/lib/cohortAdaptiveRules.ts` used by both runtime and seeder.

## Phase 2 — Seeder edge function + Dev reset button

`supabase/functions/reset-rathbones-demo/index.ts` (service role):

1. Wipe `learner_progress`, `assessment_instances`, `chapter_lock_events`, `micro_learnings`, `learner_analytics` for Rathbones account where `employee_id IN (rb-l1..rb-l9)`.
2. Load real `catalog_modules` (assoc_im), `catalog_chapters` (ordered), `catalog_assessment_blueprints`.
3. Walk each persona through its spec (Phase 3) using a shared simulation:
   - Honour `persona_module_adaptations` (skip / microlearning / diagnostic_only / emphasis).
   - Write Quick Diagnostic rows with realistic `wrong_chapters` from persona weakness tags.
   - Write per-chapter `learner_progress` with `completed_at` walking back from today at the spec'd cadence.
   - Write `assessment_instances` with `generated_questions` + `learner_responses` + `weak_topic_tags`/`strong_topic_tags`.
   - Call the same `cohortAdaptiveRules` helpers (Rule A + Rule B) so seeded state and live behaviour are byte-identical.
4. Recompute `learner_analytics` rolling counters and `last_activity_at`.

`src/pages/DevMode.tsx` gets a "Reset Rathbones learner state" button that invokes the function.

## Phase 3 — Per-persona journey specs

Specs live in `src/lib/rathbonesDemoSeed.ts` (consumed by edge fn + unit test).

**Clara Wren (rb-l3) — Rising Star** (11 wks ago, ~5 ch/wk)
- All 5 `bk*` foundation modules completed; assessments 92–100; QDs 80–90 (a few skips).
- `tk1`, `tk2`, `tk3`, `tk4` completed; one 88-score assessment → Rule A drops one micro_learning.
- `tk5.tax_wrappers` in_progress at ch 4/7.
- `bs1` (95), `bs2` (90) completed; `cps3` (100), `cps4` (96) completed.
- `oe1`, `oe2`, `oe3` completed.
- Stretch `str1.lead_client_review` unlocked + in_progress at ch 1.

**Theo Bramwell (rb-l2) — At Risk** (8 wks ago, ~2 ch/wk, 12-day idle gap)
- `bk1` completed (78); `bk2` completed-after-retake (first 62 → Rule B reopens 3 chapters → second 81; both attempts persisted).
- `bk3` in_progress at ch 3/9; `bk4`/`bk5` not_started.
- `tk1` QD scored 40 → 5 chapters reopened, 2 completed.
- `cps4.aml_financial_crime` assessment failed at 55 → 4 `micro_learnings` rows (all pending).
- Last activity 6 days ago.

**Variety personas (your last approval)**
- **rb-l5 — `needs_check_in`** (6 wks ago, ~3 ch/wk, idle 4 days). All `bk*` completed clean; `tk1` assessment scored 76 (just above pass) → 2 pending `micro_learnings`; one raised-hand signal on `tk2`.
- **rb-l7 — `rising_star_emerging`** (5 wks ago, ~4 ch/wk). Through `bk1–bk3` completed at 90+; `bk4` in_progress at ch 5/8; no failures, no micros; not yet stretch-ready. Manager rule labels as `rising_star` only at "stretch enrolled OR pace > p75 AND zero fails" — this persona hits the pace + zero-fail half, so we surface it as `rising_star` with a "emerging" rationale string in the narrative file.

**Remaining 5 personas (rb-l1, rb-l4, rb-l6, rb-l8, rb-l9) — `on_track` baseline**
- 4–9 wks ago, ~3 ch/wk, no failures, no micros, no reopens. Progress % varies 25–60%.

## Phase 4 — Manager surfaces switch to derived signals (hybrid)

`src/lib/managerSignals.ts` loads `cohort_enrollments` + `catalog_modules` + `learner_progress` + `assessment_instances` + `chapter_lock_events` + `micro_learnings` + `learner_analytics` and returns per-learner: `progressPct`, `completedModules/totalModules`, `failedAttempts`, `pendingMicrolearnings`, `reopenedChapters`, `lastActivityAt`, `derivedStatus`.

Status rule:
- `at_risk` — failedAttempts ≥ 2 OR idle > 7d
- `needs_check_in` — pendingMicrolearnings ≥ 1 AND recent activity (≤ 7d)
- `rising_star` — (stretch enrolled) OR (pace > p75 AND zero fails)
- else `on_track`

Merged with `src/lib/rathbonesNarrative.ts` (hand-written headlines, story paragraphs, AI rationale lines keyed by `employee_id`) via `src/hooks/useManagerSignals.ts`.

**Adapter route** (zero component churn): `AdaptivePathsSankey`, `RosterHeatmap`, `ActionCentre`, `AIChangesFeed`, `RosterRow` — fed via a thin wrapper inside the existing overlay loader that returns the same `LearnerOverlay` shape, hydrated from signals + narrative.

**Direct route** (rich joins): `LearnerDrawer` reads `useManagerSignals.byEmployeeId(id)` so timeline shows real `assessment_instances` (by `completed_at`), `micro_learnings`, `chapter_lock_events`. Story tab keeps the narrative paragraph.

Non-Rathbones accounts: no narrative file → adapter falls back to the existing static overlay path (unchanged).

## Technical notes (skip if non-technical)

- New files: `supabase/functions/reset-rathbones-demo/index.ts`, `src/lib/rathbonesDemoSeed.ts`, `src/lib/rathbonesNarrative.ts`, `src/lib/cohortAdaptiveRules.ts`, `src/lib/managerSignals.ts`, `src/hooks/useManagerSignals.ts`.
- Edits: `src/components/learnpath/LearnPathContent.tsx` (rule hooks), `src/components/manager-hub/LearnerDrawer.tsx` (switch to signals), one-line adapter swap inside the overlay loader for the other surfaces, `src/pages/DevMode.tsx` (reset button).
- No schema migrations. We rely on existing tables and on `assessment_instances.metadata` / `chapter_lock_events.reason` for flags.
- Service-role insert path validated against Phase 3 spec via a deterministic unit test (`src/lib/rathbonesDemoSeed.test.ts`).

## Out of scope

- Other accounts' manager surfaces.
- Reopen-across-previous-modules.
- Role-play / reflection seeding (still overlay-driven).
- Any schema change.
