## Goal
Treat the Quick Diagnostic like an assessment after submission: (a) show a proper results screen when the synthetic diagnostic row is re-opened, and (b) surface the score on the chapter row prominently — without cluttering the existing `QUICK DIAGNOSTIC` pill area.

## Current state
- Synthetic diagnostic chapter (`__diag::<moduleCode>`) renders an inline quiz via `EmbarkModuleContent` → `InlineQuiz`.
- Result is recorded in `diagnosticReopens` store and persisted to `learner_progress`.
- The only feedback today is the title appending "— 0/3 correct" (lost in row noise per the screenshot). Re-opening shows the quiz again with no recap.

## Changes

### 1. New results screen — `src/components/learnpath/DiagnosticResultsCard.tsx`
Mirrors the look of `LearnPathAssessment.tsx`'s results panel but slimmer:
- Top: large score badge (`{correct}/{total}`) + percentage; success/warning ring depending on whether all correct.
- Sub-line: "X chapters skipped · Y reopened to revisit" (counts derived from `recorded.reopened` vs total chapters in the module).
- Per-question list: question text + ✓ Correct or ✗ "answered _ — correct: _" (uses the same `diagnostic_questions` payload already loaded by `useCatalogChaptersForModule`).
- Footer actions: **Retry diagnostic** (clears the store entry for that module + reopens the quiz) and **Continue** (navigates to the next chapter via the existing diag-next resolver in `LearnPathContent`).

### 2. Wire results screen into the module render path
In `src/components/learnpath/LearnPathContent.tsx`, in the branch that handles `activeModuleId.startsWith("__diag::")`:
- After resolving `diagModuleCode` and `recorded = diagState[diagModuleCode]`, add an early branch:
  - If `recorded?.submitted` and the user did not click Retry, render `<DiagnosticResultsCard ... />` instead of `<EmbarkModuleContent>`.
  - Local `retry` state lives in this component (a `useState<boolean>(false)` keyed by `diagModuleCode`); Retry sets it true and calls `diagnosticReopens.reset()` for the module (add a `clear(moduleCode)` helper to the store) so the standard quiz UI shows again.
- Keep the existing `onDiagnosticSubmit` flow untouched — submission still records, and after submission the results card mounts on the next render.

### 3. Row-level score pill — `LearnPathChapterRow.tsx` + accordion
- Strip score from the synthetic chapter's title in `JourneyModuleAccordion.buildLensChapters` so it always reads "Quick diagnostic — 3 questions".
- Pass score data through to the row: extend `UnifiedStep` with optional `diagResult?: { correct: number; total: number; reopenedCount: number }`, populated only for the synthetic diagnostic step from `recorded`.
- In `LearnPathChapterRow.tsx`, when `step.diagResult` is present, render a small pill **next to the QUICK DIAGNOSTIC pill** (same row of badges, not a new row):
  - All correct → emerald `✓ 3/3`
  - Partial   → amber `2/3 · 1 to revisit`
  - None correct → destructive `0/3 · revisit all`
- Keep the status circle as the existing green check (the diagnostic is "done"); the pill carries the qualitative outcome. No layout changes elsewhere.

### 4. Store helper
Add `diagnosticReopens.clear(moduleCode)` (one-line) used by Retry. Existing `reset()` clears everything; we want module-scoped clear.

## Out of scope
- Persisting "viewed results" state — re-opening always lands on the results screen until Retry is pressed.
- Touching the `evidence_required` or microlearning lenses.
- Changing the recorded data model in `learner_progress`.

## Files touched
- `src/store/useDiagnosticReopens.ts` — add `clear(code)` + getter for retry state.
- `src/components/learnpath/DiagnosticResultsCard.tsx` — new file.
- `src/components/learnpath/LearnPathContent.tsx` — early branch to render results card; local retry state.
- `src/components/learnpath/JourneyModuleAccordion.tsx` — clean title; thread `diagResult` for the synthetic step.
- `src/components/learnpath/LearnPathContent.tsx` (UnifiedStep type) — add optional `diagResult`.
- `src/components/learnpath/LearnPathChapterRow.tsx` — render score pill alongside the existing lens pill.
