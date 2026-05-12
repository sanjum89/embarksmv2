## Bug

For Clara (diagnostic_only persona), `bk1.intro_wealth_rathbones`:
- Diagnostic just submitted with **0/3 correct**.
- All three real chapters tagged **REOPENED** by the lens.
- Yet the module header shows **COMPLETED** (green tick, "3 of 3 chapters") and each REOPENED chapter still has a green check.

## Root cause

Two reinforcing problems:

1. **Diagnostic submission never writes to the database.**  
   `onDiagnosticSubmit` in `LearnPathContent.tsx` only calls `diagnosticReopens.recordSubmission(...)` (in-memory store). The synthetic `__diag::<moduleCode>` chapter has no `cohortContext`, so `persistCohortChapterCompletion` no-ops. Net effect: the diagnostic outcome doesn't touch `learner_progress` at all, so the module's status — derived from `learner_progress` chapter rows in `useLearnerJourney` (line 265: `completedChapters === totalChapters → completed`) — is whatever it was before the diagnostic ran. For Clara's `bk1`, all three chapter rows happen to already be `completed` (stale from earlier sessions), so the module renders as COMPLETED.

2. **Lens preserves stale `completed` status on reopened rows.**  
   `buildLensChapters` (`JourneyModuleAccordion.tsx`, line 261):  
   ```ts
   const status = c.status === "completed" ? "completed" : "in_progress";
   ```  
   So a chapter the learner just got wrong in the diagnostic still renders with a green checkmark if the underlying `learner_progress` row is `completed`. The REOPENED badge is added but the visual state contradicts it.

## Plan

### 1. Persist diagnostic outcome to `learner_progress`
In `LearnPathContent.tsx` `onDiagnosticSubmit`, after `diagnosticReopens.recordSubmission(...)`:

- Resolve the module's full chapter list (already in `diagChapters`).
- For each chapter:
  - If `result.wrongChapterCodes` includes it → upsert `learner_progress` row with `status='in_progress'`, `completed_at=null`, `metadata.diagnostic_outcome='wrong'`.
  - Otherwise → upsert with `status='completed'`, `completed_at=now`, `metadata.diagnostic_outcome='correct'`.
- Upsert one extra synthetic row keyed by `chapter_code = '__diag'` (or `module_code` only) with `metadata.diagnostic_result = { total, correct, submitted_at, wrong_chapters }`. This lets us rehydrate the diagnostic UI on reload and lets analytics know the diagnostic was attempted.
- Trigger `onChapterPersisted` (calls `refreshJourney`) so the module status downgrades from COMPLETED to IN PROGRESS automatically.

### 2. Hydrate `useDiagnosticReopens` from DB on journey load
In `useLearnerJourney`, after fetching `learner_progress`, scan rows where `metadata.diagnostic_outcome` is set and call `diagnosticReopens.recordSubmission(...)` per module. This means a reopened state survives a page reload (today it's lost — chapters revert to "skipped" until the user takes the diagnostic again).

### 3. Make `buildLensChapters` honour the reopened state visually
Change the line to: `status: "in_progress"` unconditionally for `reopened_after_wrong`. The checkmark goes away and the row clearly shows "needs work". The DB will already be `in_progress` after step 1, but this also covers any in-flight inconsistency.

### 4. Clean up Clara's stale `bk1` rows
One-shot data fix (insert tool): for Clara (`rb-l6`) on `bk1.intro_wealth_rathbones`, set the three chapter rows back to `not_started`, clear `completed_at`. Just a one-time cleanup so the bug doesn't appear "already broken" the next time you load the page before retrying the diagnostic. (Future runs are fixed by step 1.)

### 5. Spot-check after the fix
Browser-test as Clara: open `bk1`, submit diagnostic with 0/3 → expect module pill flips from COMPLETED → IN PROGRESS, "0 of 3 chapters", all three rows show in-progress (no green tick) with REOPENED badge. Then submit a 3/3 diagnostic on another diagnostic-only module → expect COMPLETED + green ticks on all chapters.

### Out of scope

- Changing the diagnostic UX itself (still 3 MCQs, still inline).
- Touching microlearning / evidence chapters' completion logic.
- Backfilling other personas' stale `learner_progress` rows beyond the one observed module — if more turn up after the fix, we'll do them on demand.

## Technical notes

- Files touched: `src/components/learnpath/LearnPathContent.tsx` (persist logic), `src/hooks/useLearnerJourney.ts` (hydrate diag store from rows), `src/components/learnpath/JourneyModuleAccordion.tsx` (force `in_progress` for reopened), `src/store/useDiagnosticReopens.ts` (no API change, just used from more places).
- Upserts use `learner_progress.metadata` jsonb — no schema change.
- Data cleanup is a single insert-tool call, no migration.
