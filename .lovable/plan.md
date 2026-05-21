## Bug

Clara's Embark AI greeting says she has no learning path, even though she is enrolled in a cohort that's 36% complete. The cohort journey is rendered correctly in the right pane, so the data exists — the chat just greets her before it's loaded.

## Root cause

`LearnPathChat.tsx`:

- `useLearnerJourney(...)` returns `journey: null` on first render and populates it asynchronously (sets `isLoading: true` while fetching).
- The greeting effect (lines 596–623) runs as soon as `messages.length === 0`, calls `setHasGreeted(true)` immediately, builds context with `journey === null` → no `cohortJourney`, no legacy modules → falls into the "no cohort enrollment and no skill targets" branch.
- Once `journey` resolves, the effect can't re-run because `hasGreeted` is already true and a message has already been queued.

## Fix (scoped to `src/components/learnpath/LearnPathChat.tsx`)

1. Also destructure `isLoading` from `useLearnerJourney`:
   ```ts
   const { journey, isLoading: journeyLoading } = useLearnerJourney(activeAccountId, linkedEmployeeId);
   ```
2. Gate the greeting on the journey being settled:
   ```ts
   if (hasGreeted || messages.length > 0) return;
   if (journeyLoading) return; // wait for cohort journey to finish loading
   ```
   Add `journeyLoading` to the effect's dependency array so it retries once loading flips to false.
3. No other change. The existing `cohortIntro` branch already produces a rich, personalized greeting using cohort title, % complete, chapters, and resume target — once `journey` is present, it'll be used.

## Out of scope

- Edge function prompt changes.
- Greeting copy itself (already rich when given cohort context).
- Other chats (`super-agent-chat`, `chat`).
