

## Plan: Back navigation, preview-anywhere, and "View Summary" for completed chapters

Three small, focused changes to the chapter viewer (`LearnPathModuleContent.tsx`), the chapter row (`LearnPathChapterRow.tsx`), and the top bar (`LearnPathModeSelector.tsx`).

### 1. Back button to the previous view

Today the only way "back" from a chapter is the **All Modules** button, which always jumps to the journey grid even if you came from another chapter or the assessment. Add a true **Back** affordance.

- In `LearnPathModeSelector.tsx`, add a `← Back` button to the **left** of the skill-target title.
- Use a small in-context history stack on `EmbarkContext` (`viewHistory: ContentView[]` plus the previous `activeModuleId` / `assessmentModuleId`) — every time `openModule`, `openModulePreview`, `openAssessment`, `openAssessmentPreview`, or `showModuleGrid` is called, push the current view onto the stack. A new `goBack()` action pops and restores. Falls back to `showModuleGrid()` when the stack is empty.
- The button is hidden when there's nowhere to go back to (empty stack + we're already on the modules grid).

### 2. Preview locked chapters too

Today `EmbarkChapterRow` hides the **Preview** button when a chapter is `locked` (`!isLocked && !isInProgress` guard). Lock prevents normal opening, but preview is read-only and should always be available.

- In `LearnPathChapterRow.tsx`:
  - Show **Preview** for **locked** rows as well — change the guard to `!isInProgress` only.
  - Locked rows: clicking the row body still does nothing (locked), but the **Preview** button is interactive and calls `openModulePreview` / `openAssessmentPreview` as today.
  - Make the Preview button slightly more discoverable on locked rows: render it always-visible (drop the `opacity-0 group-hover:opacity-100`) when `isLocked`, since hover discovery is awkward on a disabled-looking row.
- In `LearnPathContent.tsx` (line 127), the resolver already runs for whatever `activeModuleId` is set, so previewing a locked chapter just works — no extra wiring.

### 3. Completed chapters → "View Summary" button + green Completed tag

Today the module header shows **Mark as Complete** turning into a disabled "Completed" ghost button. The post-chapter `CompletionScreen` (the stats grid) is only reachable on first completion or by clicking the row again with `initialCompleted=true`, which forces the stats screen and hides the content.

We want both: read the chapter content **and** open the summary on demand.

In `LearnPathModuleContent.tsx`:

- **Header (`renderModuleHeader`)** — when `completed` is true and not in `previewMode`:
  - Replace the disabled "Mark as Complete" button with a small **green "Completed" badge** (Tailwind: `bg-emerald-500/15 text-emerald-600 border-emerald-500/30`, `CheckCircle2` icon).
  - Next to the badge, add a **"View Summary"** outline button (`BarChart3` icon) that opens the summary screen.
- **Summary screen access** — introduce a local `showSummary` state (separate from `completed`). Today the file gates the `CompletionScreen` on `if (completed && !previewMode)` (line 606), which means a completed chapter always renders the stats screen instead of content. Change this gate to `if (showSummary && !previewMode)` and seed `showSummary = initialCompleted` only when the user explicitly opts in via the new button. Default behavior on opening a completed chapter from the journey: show the **content** with the green Completed tag + View Summary button in the header.
- The existing `CompletionScreen` is reused unchanged (it already handles `isRevisit` mode with "Module Summary" title and no auto-advance). Add a small **"Back to chapter"** button alongside its existing buttons so the user can return to the content view (`onClick={() => setShowSummary(false)}`).
- First-time completion flow (clicking Mark as Complete on an unfinished chapter) is unchanged: `handleMarkComplete` sets both `completed` and `showSummary` to true so the celebratory screen still appears with auto-advance.

### What you'll see

- Open any chapter → top bar shows **← Back** (left) and **All Modules** (right). Back returns to wherever you came from (another chapter, the assessment view, or the grid).
- In **All Modules**, hover (or just look at) a 🔒 locked chapter → **Preview** button is visible. Click it → opens the chapter in preview mode with the existing "Preview mode — progress is not tracked" banner. Normal click on the row still does nothing.
- Open a previously completed chapter from the journey → you see the **chapter content**, with a green **Completed** tag and a **View Summary** button in the header. Click View Summary → the existing stats screen appears with a **Back to chapter** button to return.

### Files touched

- `src/contexts/LearnPathContext.tsx` — add `viewHistory` stack, push on every navigation action, expose `goBack()`.
- `src/components/learnpath/LearnPathModeSelector.tsx` — add the `← Back` button on the left of the title; hide when history is empty and view is `modules`.
- `src/components/learnpath/LearnPathChapterRow.tsx` — show Preview button for locked rows (always visible on locked, hover-revealed otherwise).
- `src/components/learnpath/LearnPathModuleContent.tsx` — split `completed` from `showSummary`; render green **Completed** badge + **View Summary** button in `renderModuleHeader`; gate the `CompletionScreen` on `showSummary`; add **Back to chapter** action inside `CompletionScreen`.

No data model, no edge function, no schema changes.

