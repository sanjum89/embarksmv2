## Problem
In Clara's evidence-required (and diagnostic-only, before submission) modules, the chapters listed beneath the synthetic task are pre-marked `status: "skipped"`, which renders them with the **amber SkipForward** icon — implying they're already skipped before the user has actually submitted evidence / taken the diagnostic.

## Fix
Show the same SkipForward icon but **greyed out (muted)** while the skip is only *predicted*, and only switch to amber once the skip is *actually committed* (evidence submitted / diagnostic taken).

## Changes

**1. `src/components/learnpath/JourneyModuleAccordion.tsx` — `buildLensChapters`**

Add a `pending` flag on the lens chapter when the trigger hasn't been completed yet:

- `evidence_required` branch: track whether the synthetic evidence task is submitted (look up `learner_progress` for `__evi::<moduleCode>`, mirroring how `diag` is passed in). If not submitted, mark each real chapter as `lensState: "covered_by_evidence"` with a new `pendingSkip: true` field. If submitted, keep current behaviour (status `skipped`, amber).
- `diagnostic_only` branch (not submitted path): set `pendingSkip: true` on the chapters that currently get `skipped_by_diagnostic`.

`LensChapter` type gains `pendingSkip?: boolean`. Pass it through into the `UnifiedStep` mapping (`pendingSkip: (c as any).pendingSkip`).

**2. `src/components/learnpath/LearnPathContent.tsx` — `UnifiedStep` type**

Add optional `pendingSkip?: boolean`.

**3. `src/components/learnpath/LearnPathChapterRow.tsx`**

In the `statusNode` ladder, add a branch above `isSkipped`:

```tsx
} else if (step.pendingSkip) {
  // Predicted skip — same icon, greyed out
  <div className="h-7 w-7 rounded-full bg-muted ring-2 ring-border flex items-center justify-center">
    <SkipForward className="h-4 w-4 text-muted-foreground" />
  </div>
}
```

Also keep `isReadOnlySkipped` behaviour (clicks open preview) — pending-skip rows should behave the same: `isReadOnlySkipped = isReadOnlySkipped || step.pendingSkip`.

**4. Acquiring "evidence submitted" signal**

`buildLensChapters` is called with `diag` (already passed in). Add a parallel `evi?: { submitted: boolean }` parameter, populated by the same hook that builds `DiagSnap` — check `learner_progress` for `code = '__evi::' + moduleCode` with status `completed`. Locate the call site (near the existing `diag` resolution above line 150) and add an `eviByModule` map alongside it.

## Out of scope
- Badge colours stay as-is (the green "COVERED BY EVIDENCE" pill is fine).
- No changes to journey/skip business logic — purely presentational.
