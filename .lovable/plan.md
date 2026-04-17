

## Plan: Clean Up Module Completion Screen + Auto-Advance Timer

### Issues
1. The completion screen still shows the **learning mode tabs** (Visual / Reading / Listening / Hands-On / Combined) at the top — these are irrelevant once the module is done and just add noise.
2. After completing a module, the user has to manually click "Continue to Next Chapter". You want a **5-second auto-advance with a visible progress bar** (cancellable by hovering / clicking elsewhere).
3. Every completed module should retain its **completion summary page** so the user can navigate back and review their stats (time spent, mode used, next-up).

### Investigation needed
Confirm where the mode selector renders relative to the completion screen and where the completion UI lives. Likely candidates: `LearnPathModuleContent.tsx`, `LearnPathModeSelector.tsx`, `LearningModulePage.tsx`. I'll verify before implementing.

### Implementation

**1. Hide mode selector on completion screen**
- In `LearnPathContent.tsx` (Embark) and `LearningModulePage.tsx` (standalone) and `TraditionalContentViewer.tsx` (Skill Target): when the active module's internal `completed` state is true, suppress the mode selector row.
- Cleanest path: lift a `completed` flag out of `EmbarkModuleContent` via an `onCompletedChange` callback so the parent can conditionally hide the selector. Alternative: render the selector inside `EmbarkModuleContent` and gate it on internal state. Will pick whichever requires fewer touchpoints after exploring.

**2. Auto-advance countdown (5s) on completion screen**
- Inside the completion view of `EmbarkModuleContent` (or `LearnPathModuleContent` — wherever the "Continue to Next Chapter" button lives), add:
  - A `useEffect` that starts a 5s timer when `completed === true` AND a `nextModuleId` exists
  - A `<Progress>` bar (existing `src/components/ui/progress.tsx`) animating 0 → 100% over 5s
  - Label: *"Auto-advancing in 5s…"* with a small "Stay here" button to cancel
  - On timer expiry → call the same handler that "Continue to Next Chapter" uses (`openModule(nextId)` or navigate)
  - Cancel timer if user hovers the completion card, scrolls, or clicks anywhere on the card → switches to "Click to continue" state
  - If no next module exists, skip timer and show only "Back to Modules"

**3. Persist completion summary for revisit**
- Already mostly works: re-opening a completed module currently re-mounts (per the previous `key={module.id}` fix) which **resets** `completed` to false. To let users **revisit** the summary, add a check: when entering a module whose underlying step status is `"completed"`, mount with `completed = true` (initial state derived from `step.status`).
- Source: `step.status === "completed"` is already tracked in `SkillTargetsContext`. Pass `initialCompleted` prop to `EmbarkModuleContent` from each parent that knows the step status.
- Time-spent stat for re-visits: show "Previously completed" instead of live timer when `initialCompleted` is true.

### Files to edit
- `src/components/learnpath/LearnPathModuleContent.tsx` (or `EmbarkModuleContent` source) — add countdown timer, progress bar, `initialCompleted` prop, `onCompletedChange` callback
- `src/components/learnpath/LearnPathContent.tsx` — hide `EmbarkModeSelector` when completed; pass `initialCompleted` based on step status
- `src/pages/LearningModulePage.tsx` — hide local mode selector row when completed; pass `initialCompleted`
- `src/components/skill-target/TraditionalContentViewer.tsx` — same hide + pass `initialCompleted`
- (Possibly) `src/components/learnpath/LearnPathModeSelector.tsx` — accept a `hidden` prop, or just conditionally render at parent level

### What you'll see
1. Finish a chapter → completion summary appears (no mode tabs above it)
2. A thin progress bar fills over 5 seconds with "Auto-advancing in 5s — Stay here" label
3. At 0s → next chapter content loads automatically
4. Hover / click completion card → timer cancels, button reverts to "Continue to Next Chapter"
5. Open any previously-completed module from the grid → summary screen appears immediately (no timer, just stats + "Back to Modules" / "Continue" if applicable)

