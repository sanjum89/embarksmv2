## Root cause

The Embark AI greeting is sent **before the cohort journey finishes loading**, so the context is empty and the assistant falls into the "no learning path assigned" branch — even though Clara is actually enrolled in cohort `Investment Management Readiness — Jan 2026` with 5 tracks.

The race:

1. `useLearnerJourney(accountId, employeeId)` initializes its state as `{ journey: null, isLoading: false }`.
2. The DB fetch is kicked off inside a `useEffect`, so it only flips `isLoading: true` after the first render.
3. `EmbarkChat`'s greeting effect runs on the very first render, sees `journeyLoading === false` and `journey === null`, and immediately fires the "no cohort, no skill targets — speak with your manager" greeting.
4. The suggestion pills then render the `!hasModules` pool ("How do I get started?", "Explore popular targets", …), which is what the screenshot shows.

Once the fetch eventually returns the cohort, it's too late — the AI has already greeted and the conversation never re-syncs.

## Plan

1. **Fix `useLearnerJourney` initial state** — start with `isLoading: true` when both `accountId` and `employeeId` are provided, and only flip to `false` after the first fetch completes. This closes the first-render race for every consumer (chat, Agent One, PickUpWhereYouLeftOff, etc.).

2. **Harden the greeting gate in `EmbarkChat`** — additionally wait until either `journey` is non-null OR the hook has completed at least one fetch (track via a small `journeyResolved` ref or by checking `isLoading === false` AND a `hasFetchedOnce` flag exposed by the hook). This guarantees the greeting message reflects Clara's true cohort state.

3. **Re-greet correctly when journey arrives late** — if the journey resolves *after* mount, the existing `hasGreeted` flag locks the wrong greeting in. Reset / defer `hasGreeted` until journey resolution so Clara always sees the cohort-aware welcome ("You're on *Investment Management Readiness — Jan 2026*, resume at **<chapter>**…").

4. **No backend/edge-function change required** — `learnpath-chat/index.ts` already renders a proper "Your Cohort Journey" block when `context.cohortJourney` is present; the bug is purely that the client wasn't sending it.

## Validation

- Sign in as Clara → open Embark AI on `/` → first message must reference her cohort name, % progress, and resume chapter (not "we don't have a specific learning path").
- Suggestion pills below should be the cohort-aware set (resume / next module / show path), not the generic "How do I get started?" pool.
- Sign in as Theo / another enrolled persona → same cohort-aware greeting.
- Sign in as a learner with no enrollment → still gets the "speak with your manager" greeting (no regression).
