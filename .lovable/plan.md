## Problem

Clara is enrolled in the "Investment Management Readiness" cohort (with 5 tracks, 29 modules in Lovable Cloud), but the Embark page shows the **"No Learning Journey Yet"** empty state.

Root cause: `EmbarkContent` (`src/components/learnpath/LearnPathContent.tsx`) decides what to render based on `allSteps`, which is derived from the **legacy `skillTargets` pipeline**. Clara has no legacy skill targets assigned, so `hasSteps = false` and the legacy empty state wins — the new `EmbarkJourneyView` (cohort-driven) is only reached when `contentView === "modules"`, which the user never triggers because auto-resume can't find a step.

The new `useLearnerJourney` data is never consulted at the top level.

## Fix

Make the cohort journey the **primary source of truth** for "what to render on Embark when nothing else is open", so a learner enrolled in a cohort always sees the new view, regardless of legacy skill-target state.

### 1. Lift cohort-journey awareness into `EmbarkContent`

In `src/components/learnpath/LearnPathContent.tsx`:

- Call `useLearnerJourney(activeAccountId, employeeId)` at the top, alongside the existing legacy data.
- Compute `hasJourney = !!journey && journey.tracks.some(t => t.totalChapters > 0)`.
- Treat `hasJourney || hasSteps` as "learner has something to do".

### 2. Default Embark view = cohort journey when present

Reorder the render branches so that, when `contentView === "welcome"` (the initial state) **and** `hasJourney` is true, we render `<EmbarkJourneyView legacySteps={allSteps} activeChapterId={activeModuleId} />` directly instead of the welcome card or the empty state.

Render priority becomes:

1. `assessment` view (unchanged)
2. `module` view (unchanged)
3. `contentView === "modules"` → `EmbarkJourneyView` (unchanged)
4. **NEW:** `contentView === "welcome"` && `hasJourney` → `EmbarkJourneyView`
5. Empty state ("No Learning Journey Yet") only when **both** `!hasJourney` and `!hasSteps`
6. Legacy welcome card only when `hasSteps && !hasJourney` (legacy-only accounts like Cornerstone)

### 3. Disable legacy auto-resume when journey is in charge

The current auto-resume effect immediately calls `openModule` on the first legacy in-progress/available step. For Clara that array is empty so it's a no-op, but we must make sure it stays a no-op for cohort learners and doesn't fight the journey UI: gate it on `!hasJourney` so it only runs for legacy accounts.

### 4. No changes to

- `useLearnerJourney`, `JourneyHeaderCard`, `JourneyTrackTabs`, `JourneyModuleAccordion`, `EmbarkJourneyView` — already correct.
- Legacy `skillTargets`/`learningModules` pipeline — still used for chapter content rendering and for non-cohort accounts (Cornerstone, Pinnacle).
- Database, RLS, edge functions, sidebar, dashboard.

## Verification

- Log in as Clara → Embark page → see `JourneyHeaderCard` ("Investment Management Readiness", 0%), 5-segment track strip, `JourneyTrackTabs`, and the first track's modules with chapters. No "No Learning Journey Yet" screen.
- Click a chapter → still opens via existing `openModule` path (chapter-click behavior in `JourneyModuleAccordion` is unchanged).
- Log in as a Cornerstone learner with legacy skill targets → still sees legacy auto-resume + legacy welcome/modules behavior.
- Log in as a learner with neither cohort nor skill targets → still sees the "No Learning Journey Yet" empty state with skill-gap recommendations.
