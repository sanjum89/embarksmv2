## Plan: AI-style loading state for Embark page

**Problem:** When navigating to Embark, `useLearnerJourney` is fetching from the database. During that time, `EmbarkContent` renders the "No Learning Journey Yet" empty state because `hasJourney` is false and `hasSteps` is false. Once the fetch resolves, the journey view appears. This flash makes it feel broken.

**Fix:** Surface the loading state from `useLearnerJourney` into `EmbarkContent`, and render a polished AI-themed loading view instead of the empty state while the journey is still loading.

### Changes

**1. `src/hooks/useLearnerJourney.ts`** — already exposes `isLoading`. No change needed (verify).

**2. `src/components/learnpath/LearnPathContent.tsx`**
- Destructure `isLoading: journeyLoading` from `useLearnerJourney`.
- Before the empty-state branch (`!hasSteps`), add: `if (journeyLoading) return <EmbarkLoadingState />;`
- Also guard auto-resume: don't trigger before journey loads (already partially handled).

**3. New component `src/components/learnpath/EmbarkLoadingState.tsx`**
A friendly AI-working visual:
- Centered layout, `animate-fade-in`
- Sparkles / GraduationCap icon in a soft accent-tinted circle with a subtle pulsing glow (animated ring using `animate-ping` on an absolutely-positioned ring + the icon static on top)
- Rotating status messages every ~1.2s using `setInterval`:
  1. "Retrieving your learning journey…"
  2. "Pulling your cohort and tracks…"
  3. "Personalizing your next steps…"
- Three skeleton bars below (using existing `Skeleton` component) mimicking the journey header card + track tabs + module rows so the layout shape is recognizable before content arrives.
- All colors via semantic tokens (`text-accent`, `bg-muted`, `text-muted-foreground`).

### Out of scope
- No backend/data changes.
- No change to legacy (Cornerstone/Pinnacle) flow — they go through a different code path that already auto-resumes immediately.
