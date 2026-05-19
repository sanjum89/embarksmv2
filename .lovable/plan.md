## Root cause

The reset edge function seeds the DB correctly, and `useManagerCohortData` reads it back (that's why Clara's own learner view + the cohort drill-down look right). The screens that are *still* showing old data — Julian's **Team Dashboard** (`/team`) and the **Action Centre** — never query the DB. They synchronously call `getAllDemoOverlays()` from `src/data/managerDemoOverlay.ts`, which returns the module-level `OVERLAY` object built once at import time from hand-authored persona stories.

Callers still on the legacy synchronous overlay:

- `src/pages/TeamMode.tsx` — Julian's `/team` landing (roster, KPI strip, action queue, schedule cards)
- `src/pages/ActionCentre.tsx` — `/action-centre` (admin / manager Action Centre)
- `src/pages/ManagerCohortPicker.tsx` — `/manager/cohorts` KPI tiles
- `src/components/team-home/SendCheckInDialog.tsx`
- `src/components/team-home/Schedule1on1Dialog.tsx`
- `src/components/people-graph/EmployeeSignalExplorer.tsx`

The DB-backed overlay logic only lives inside `useManagerCohortData`. Everywhere else still reads the baked-in data.

## Fix

### 1. Extract a shared hook — `useRathbonesPersonaOverlays`
New file `src/hooks/useRathbonesPersonaOverlays.ts` that returns the same overlay shape `useManagerCohortData` already produces, but for the *standard Rathbones cohort* without the cohort-page chrome.

- Resolves `accountId` from `useAccount` and defaults `cohortId` to `RATHBONES_COHORT_ID` (override accepted).
- Loads `cohorts` + `catalog_modules` (filtered by `role_cohort_code`) + `catalog_chapters` chapter counts + `cohort_enrollments` once.
- For each persona in `RATHBONES_PERSONA_IDS` ∪ live enrollments, runs `loadEmployeeSignals` + `overlayFromSignals` exactly like `useManagerCohortData` does today.
- Falls back to `getDemoOverlay(id)` only when the DB returned zero rows for that employee (safety net for fresh / un-seeded accounts).
- Returns `{ loading, overlays, byId, modules }`.

Refactor `useManagerCohortData` to delegate its per-employee loop to this shared hook so the two cannot drift apart.

### 2. Account-agnostic — works for Pinnacle (white-label) too
Pinnacle Capital is a deep clone of Rathbones with the same `RATHBONES_COHORT_ID` and the same `rb-l*` employee IDs (per the `useContentSubstitution` core rule). The new hook keys off `activeAccount.id` for the DB filter and the persona IDs are shared, so swapping the account in the switcher transparently flips Pinnacle's manager/admin screens to its own seeded DB rows. No Pinnacle-specific branch is required — confirm by:
- Reset → switch account to Pinnacle → log in as Julian (or Pinnacle's equivalent manager) → `/team` and `/action-centre` reflect the seeded state, with `useContentSubstitution` already rewriting "Rathbones" → "Pinnacle Capital" in any narrative strings.

### 3. Migrate the six callers
Drop the synchronous `getAllDemoOverlays()` / `getDemoOverlay(id)` calls and read from the hook instead:

- `TeamMode.tsx` — replace `const overlays = getAllDemoOverlays()` with `useRathbonesPersonaOverlays()`. Gate the existing `useMemo` blocks on `loading`. Show the same lightweight skeleton pattern used by `ManagerCohortHub`.
- `ActionCentre.tsx` — same swap. Pending counts will now flow from real `micro_learnings` / `chapter_lock_events` rows.
- `ManagerCohortPicker.tsx` — use `overlays` for the KPI tiles ("Active learners", "Needs attention") and per-tile progress %.
- `SendCheckInDialog.tsx`, `Schedule1on1Dialog.tsx` — dialogs only mount when opened; safe to call the hook unconditionally.
- `EmployeeSignalExplorer.tsx` — read `byId[employee.id]` instead of `getDemoOverlay(employee.id)`.

### 4. Mark legacy paths fallback-only
Add a one-line JSDoc to `getAllDemoOverlays` / `getDemoOverlay` in `src/data/managerDemoOverlay.ts`:
`@deprecated Use useRathbonesPersonaOverlays. Kept as fallback for un-seeded accounts.`
Bodies unchanged.

## Verify (manual repro after build)
1. **Dev Tools → Reset Rathbones demo** (the just-fixed edge function).
2. Active account = Rathbones, log in as Julian (`rb-mgr`):
   - `/team` shows Clara as the only `rising_star`, Theo as `needs_check_in`, the other 7 personas on the `baselineSpec(...)` baseline.
   - `/action-centre` pending items reflect only Clara / Theo (other personas have no pending micros per the reset spec).
3. Switch active account → Pinnacle Capital, log in as the equivalent manager → same screens reflect Pinnacle's seeded state with white-labeled copy.
4. `/manager/cohort/{id}` drill-down (already DB-backed) and Julian's `/team` now show the same status for the same employee.

## Out of scope
- The reset edge function itself (it already produces the correct DB state).
- Clara / Theo narrative overrides in `rathbonesNarrative.ts` (already applied inside `overlayFromSignals`).
- Other screens importing only *types* from `managerDemoOverlay` (no behavior change needed).
