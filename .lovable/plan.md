## Goal

Clean-slate Rathbones: one admin, one manager, nine learner personas (Clara is one of them). Only Clara is enrolled in the Associate IM cohort with the full module curriculum. Everyone else exists but has no cohort, no modules. Rathbones shows up as its own account in the switcher with branding.

## ID scheme (numeric, per your choice)

- `rb-admin` — Rathbones Admin (top, no manager)
- `rb-mgr` — Julian Wexford (Investment Director, reports to `rb-admin`)
- `rb-l1` Sophie Linden — Early × Outside FS
- `rb-l2` Maya Holloway — Early × FS non-IM
- `rb-l3` Theo Marchant — Early × In IM
- `rb-l4` Owen Castell — Mid × Outside FS
- `rb-l5` Priya Aldridge — Mid × FS non-IM
- `rb-l6` **Clara Wren** — Mid × In IM
- `rb-l7` Rosa Belmont — Experienced × Outside FS
- `rb-l8` Felix Arden — Experienced × FS non-IM
- `rb-l9` Elliot Hayes — Experienced × In IM

All `rb-l*` report to `rb-mgr`. All `rb-l*` are role `learner`, title `Associate Investment Manager`.

## Plan

### Step 1 — Create the Rathbones account in DB

- Insert a new `accounts` row: `name = 'Rathbones'`, `is_default = false`, `accent_color` + `logo` from the existing Rathbones palette (deep navy primary, peach accent per the saved Rathbones palette memory).
- This is a brand-new account ID. Cornerstone Demo and Pinnacle Capital are untouched at the account level.

### Step 2 — Wipe all old `rb*` records

Across the existing default account, delete every row tied to the previous `rb01`–`rb19` set:
- `cohort_enrollments` for any `employee_id` starting `rb`
- `employee_persona_assignments` for any `employee_id` starting `rb`
- `learner_progress`, `assessment_instances`, `chapter_lock_events`, `learner_analytics`, `readiness_gate_results`, `promotion_signals`, `mentor_assignments` for any `employee_id` starting `rb`
- Remove `rb01`–`rb19` from `accounts.data.employees` on the default account
- `employee_personas` rows we created last round can stay (they're archetype tags, not user records) but will be re-pointed to the new Rathbones account_id

### Step 3 — Seed the 11 fresh employees inside the Rathbones account

Write the 11 records above into the new Rathbones account's `data.employees` array with the hierarchy `rb-admin → rb-mgr → rb-l1..rb-l9`.

### Step 4 — Re-point Rathbones-only catalog & cohorts to the new account

Move from the default account → the new Rathbones account:
- `cohorts` (Associate IM, IM shell, IM Director shell, Sr IM Director shell)
- `learning_tracks`, `domains`, `role_progressions`
- `catalog_modules`, `catalog_chapters`, `catalog_assessment_blueprints`, `catalog_evidence_tasks`, `catalog_readiness_gates`, `catalog_gate_requirements`
- `employee_personas` (the 9 archetypes)

Cornerstone Demo's original `u*` content stays put.

### Step 5 — Persona assignments + Clara's cohort enrollment

- Insert 9 `employee_persona_assignments` mapping `rb-l1..rb-l9` → their persona archetype code.
- Insert exactly **one** `cohort_enrollments` row: `rb-l6` (Clara) → Associate IM cohort.
- No other cohort enrollments. No `learner_progress` seeding.

### Step 6 — Finish the Associate IM module catalog

- Run the existing `catalog-import` edge function against the new Rathbones `account_id` for the 17 module codes already defined in `supabase/functions/catalog-import/skeleton.ts` but not yet imported (`bs1–bs5`, `cps1–cps5`, `oe1–oe4`, `str1–str3`).
- Result: Associate IM cohort has the full ~29-module curriculum, all visible to Clara.
- IM and IM Director cohorts remain empty shells (out of scope for this slice).

### Step 7 — UI fix so Rathbones appears in the switcher

- In `src/contexts/AccountContext.tsx`, the Pinnacle clone block already searches for an entry whose `branding.name === "Rathbones"` and falls back if missing. With Step 1 in place, this just works — Pinnacle will properly clone from Rathbones.
- Update `AccountContext` so the new Rathbones account (a non-default DB row containing `data.employees` in the v1 shape) is normalized correctly with branding name "Rathbones" and the navy/peach colors.
- No changes to Cornerstone Demo's existing branding/normalization.
- Account switcher will now list three accounts: **Cornerstone Demo**, **Rathbones**, **Pinnacle Capital**.

### Step 8 — Verify

- `accounts` returns 3 rows.
- New Rathbones account has 11 employees (`rb-admin`, `rb-mgr`, `rb-l1..rb-l9`).
- `cohort_enrollments` for the Rathbones account = 1 row (Clara).
- `catalog_modules` for the Rathbones account ≈ 29 with `role_cohort_code = 'assoc_im'`.
- In the UI: switch to Rathbones, see navy/peach branding; open Clara, see Associate IM cohort + full module list; open another persona (e.g. Felix), see no cohort and no modules.

## Out of scope (explicit)

- IM and IM Director module authoring.
- Promotion-signal logic (auto-suggest Clara for IM based on performance).
- Persona descriptions, skill / proficiency / competency mapping.
- Seeding any `learner_progress`.

Reply **go** to execute.
