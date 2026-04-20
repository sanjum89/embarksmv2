

## Fix: Opening a completed chapter should show the chapter, not the summary

### Problem

In `src/components/learnpath/LearnPathModuleContent.tsx` line 65, `showSummary` is initialized to `initialCompleted`. So when a learner clicks a previously completed chapter from the journey, the chapter mounts with the summary screen open instead of the chapter content — defeating the whole point of the `Completed` badge + `View Summary` button added in the previous round.

### Fix

One-line change: seed `showSummary` to `false` regardless of `initialCompleted`.

- `src/components/learnpath/LearnPathModuleContent.tsx`, line 65:
  - From: `const [showSummary, setShowSummary] = useState(initialCompleted);`
  - To: `const [showSummary, setShowSummary] = useState(false);`

`isRevisit` (line 66) stays seeded from `initialCompleted` — it's only used to flag the `CompletionScreen` as a revisit when the user *does* click View Summary, so the title reads "Module Summary" with no auto-advance.

### What you'll see

- Click a completed chapter from **All Modules** → the chapter content renders, with the green **Completed** badge and **View Summary** button in the header (already wired up).
- Click **View Summary** → the existing summary screen opens, with **Back to chapter** to return.
- First-time completion (clicking Mark as Complete on an unfinished chapter) is unchanged — `handleMarkComplete` explicitly sets `showSummary = true` so the celebratory screen still appears with auto-advance.

### Files touched

- `src/components/learnpath/LearnPathModuleContent.tsx` — change line 65 only.

No other changes.

