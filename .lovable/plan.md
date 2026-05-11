
## Quick Diagnostic — full fix

Today, when a `diagnostic_only` module is rendered (e.g. Clara's "Introduction to Wealth Management"), the cohort path collapses **all** chapters into a single synthetic "Quick diagnostic" entry whose questions come from **the first chapter only** (`composeChapterTranscript` + `buildLensChapters`). Submitting answers does nothing unless the learner gets every question right, and even then the cohort `learner_progress` row is never updated, the next chapter is not advanced to, and the originally skipped chapters are hidden from the UI.

This plan corrects all four behaviours and is **frontend / presentation only** — no DB schema or migration changes.

### 1. Show all chapters; mark skipped ones visibly

In `src/components/learnpath/JourneyModuleAccordion.tsx → buildLensChapters`:

- For `diagnostic_only`: keep the **real** chapters in the list (status visually rendered as "Skipped — diagnostic"), and **insert** one synthetic "Quick diagnostic — 3 questions" row at position 1 (top). Skipped chapters render below it, locked but viewable in read-only preview.
- For `microlearning`: keep all chapters; mark the trimmed/foundation ones as "Condensed away — view if you want" (read-only preview), keep the kept ones interactive.
- For `evidence_required`: same idea — show real chapters as "Covered by evidence" + one synthetic "Submit evidence" row.
- For `full_module` / `skip_after_validation`: unchanged.

Add a new `JourneyChapter` flag `lensState: "active" | "skipped_by_diagnostic" | "trimmed_by_micro" | "covered_by_evidence" | "reopened_after_wrong" | "synthetic_diagnostic" | "synthetic_evidence"` so the row component can render the correct chip.

Update `EmbarkChapterRow` (`src/components/learnpath/LearnPathChapterRow.tsx`) to:
- Show a small "Skipped" / "Condensed" / "Covered by evidence" pill next to the chapter title for non-active lens states.
- Allow clicking a skipped/trimmed chapter — it routes to the chapter in **`previewMode`** (existing flag in `LearnPathContext`) so the learner can read but no progress is written.
- Render `synthetic_diagnostic` rows with the violet diagnostic styling already used for the badge.

### 2. Diagnostic questions sourced from the skipped chapters

In `src/hooks/useCatalogChapter.ts`:
- Add `composeDiagnosticTranscript(chapters: CatalogChapterContent[], moduleTitle: string)` that takes **every chapter in the module**, picks one diagnostic question from each (round-robin up to 3), and returns the markdown + `inline_quiz` rich block. Each question carries an extra `chapterCode` field in the rich block JSON so we can map answers back to chapters.
- Extend `DiagnosticQuestion` with `chapterCode?: string`.

In `src/components/learnpath/LearnPathContent.tsx` (cohort branch around lines 158-189):
- Replace the single-chapter `useCatalogChapter` call with a new `useCatalogChaptersForModule(accountId, moduleCode)` hook that returns **all** chapter rows for the active module.
- For `diagnostic_only` lens, build the synthetic transcript with `composeDiagnosticTranscript(allChaptersOfModule)` instead of using the first chapter alone.
- For `full`/`condensed`/`evidence`, keep the existing single-chapter flow.

Add `composeDiagnosticTranscript` to `extractInlineQuizzes` knowledge — `InlineQuiz` already strips RICH_BLOCK; we'll forward `chapterCode` through `ParsedInlineQuiz.questions`.

### 3. Submit always counts as "diagnostic done" + adaptive reopen

In `src/components/learnpath/InlineQuiz.tsx`:
- Replace `onPass` with a single callback `onSubmit({ correct: number[]; wrong: { index: number; chapterCode?: string }[]; allCorrect: boolean })` fired **once on Submit** — regardless of pass/fail.
- Keep the inline "X/Y correct" UI and the explanations, but remove the "Try again" reset (single attempt; learner reads the reopened chapters instead).
- Carry `chapterCode` from the parsed block onto each question so the callback can report it.

In `src/components/learnpath/LearnPathModuleContent.tsx` (the inline-quiz block at lines 692-705):
- Always call `handleMarkComplete()` on submit. Pass the wrong-answer chapter codes upward via a new `onDiagnosticSubmit?: (wrongChapterCodes: string[]) => void` prop.

In `LearnPathContent.tsx` (cohort branch):
- When `onDiagnosticSubmit` fires:
  - **Optimistic UI:** call a new `markChaptersReopened(moduleCode, wrongChapterCodes)` action on a new tiny `useDiagnosticReopens` zustand-style store (same `useSyncExternalStore` pattern as `useManagerActions`). The store keeps `Map<moduleCode, Set<chapterCode>>` of reopened chapters for the session.
  - Mark the synthetic diagnostic row as `completed` (also store-backed: `Set<moduleCode>` of submitted diagnostics).
  - Best-effort write `learner_progress` rows: synthetic diagnostic chapter → `completed`; reopened chapters → `in_progress` so the journey hook picks them up next render. Failures are ignored (optimistic).
- `JourneyModuleAccordion.buildLensChapters` reads from `useDiagnosticReopens`. If `diagnostic_only` and the diagnostic was submitted:
  - Synthetic diagnostic row stays at top, marked `completed`.
  - Wrong-answer chapter codes get `lensState: "reopened_after_wrong"` and `status: "in_progress"`/`"available"` instead of `"skipped_by_diagnostic"` — they become fully interactive.
  - Other chapters remain visible-but-skipped.

The exact ordering the user requested falls out naturally: chapter 1 (skipped chip) → quick diagnostic (completed chip) → chapter 2 reopened → chapter 3 reopened.

### 4. Advance after Submit

After the optimistic store updates, `LearnPathContent` calls `notifyModuleCompleted({...})` (already done elsewhere) using the next reopened chapter as `nextModuleId` if there is one, otherwise the next module in the track. The existing CompletionScreen auto-advance (5 s countdown) handles routing.

### Files touched

```
edited  src/hooks/useCatalogChapter.ts        + composeDiagnosticTranscript, chapterCode on questions
new     src/hooks/useCatalogChaptersForModule.ts  fetch all chapters for a module
new     src/store/useDiagnosticReopens.ts     session-scoped reopen state
edited  src/components/learnpath/InlineQuiz.tsx   onSubmit callback w/ wrongChapterCodes
edited  src/components/learnpath/LearnPathModuleContent.tsx  always-complete on diagnostic submit
edited  src/components/learnpath/JourneyModuleAccordion.tsx  keep skipped visible + reopen logic
edited  src/components/learnpath/LearnPathChapterRow.tsx     skipped/condensed/reopened chips + preview click
edited  src/components/learnpath/LearnPathContent.tsx        diagnostic uses ALL chapters, wires onDiagnosticSubmit
```

### Out of scope

- No DB schema changes.
- No persistence beyond the optimistic `learner_progress` upserts already implied by the codebase pattern.
- Theo's flow (`full_module`) is unchanged.
- Manager AI Changes feed continues to read from `persona_module_adaptations` as today.
