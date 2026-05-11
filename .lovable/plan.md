# Julian's My 360 — same shape as Clara/Theo

Goal: make `/my-360` work for Julian Wexford (rb-mgr) with the same Profile tab UI Clara and Theo see, showing him as a strong senior IM Director with 1–2 development areas.

## What's missing today

The `useMy360Data` hook returns `eligible: false` for Julian (no `employee_capability_proficiency` rows), so `/my-360` redirects him to the legacy view. He also has no persona assignment, no persona competency profile, and no role requirements for `im_director`.

## Plan

### 1. Pick a persona for Julian
Reuse the existing `senior_leader` persona (already in `employee_personas`). Assign it to `rb-mgr` via `employee_persona_assignments`.

### 2. Seed competency data (Profile tab)

Insert into `persona_competency_profiles` for `senior_leader` — one row per competency in the existing 16-item Rathbones catalog. Mature levels overall (4–5) with two visible gaps:

- **Gap 1**: `oe.systems_data_ai` — Rathbones IT Systems, Data & AI-enabled Tools → current 3
- **Gap 2**: `cps.regulatory_consumer_duty` → current 3
- Everything else: 4 or 5 with `confidence='high'`

Insert into `role_competency_requirements` for `role_cohort_code='im_director'` — required levels of 4–5 across the catalog (the two gaps requiring 5 so they show as development areas).

Insert into `employee_capability_proficiency` for `rb-mgr` — mirror the persona levels using the existing capability codes (so `eligible=true` and the Capability Strip + radar render). Pull capability codes from `role_capability_requirements` and seed at director-appropriate levels with two gaps that map to the same two competency tracks.

### 3. Fix one hardcoded role cohort in the hook

`src/hooks/useMy360Data.ts` currently hardcodes `role_cohort_code='assoc_im'` when fetching `role_capability_requirements` and `role_competency_requirements`. Change it to derive from: cohort.role_cohort_code → persona's `default_role_progression_code` → fallback `assoc_im`. Julian has no cohort, so it'll use `senior_leader.default_role_progression_code = 'sr_im_director'` — we'll seed his role_competency_requirements under `im_director` and update the persona's default to `im_director` (or seed under `sr_im_director` — we'll use `im_director` to match his title and update the persona row).

### 4. Hide the two empty tabs for Julian
Profile-tab-only scope. In `NewMy360.tsx`, when `data.modules.length === 0` and `data.cohort` is undefined, render only the Profile tab (drop "Cohort Journey" and "Growth Path" from the pill switcher). This keeps the page clean for Julian without breaking Clara/Theo.

## Files touched

- `src/hooks/useMy360Data.ts` — derive role_cohort_code instead of hardcoding `assoc_im`
- `src/pages/NewMy360.tsx` — conditionally hide cohort/growth tabs when no cohort data
- New SQL inserts (via insert tool) for: `employee_persona_assignments`, `persona_competency_profiles`, `role_competency_requirements`, `employee_capability_proficiency`, and a small update to `employee_personas.default_role_progression_code` for `senior_leader`

No schema changes. No new components — reuses ProfileHero, StatStrip, CompetencyRadarHero, CapabilityStrip exactly as-is.
