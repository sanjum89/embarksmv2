# Add "Take a tour" to the sidebar

The guided tour currently launches from a floating bottom-left pill (`TourLaunchButton`). Once a user dismisses or closes it, there is no permanent way to reopen it. We'll add a persistent sidebar entry so the tour is always one click away.

## What to build

In `src/components/layout/AppSidebar.tsx`, add a new "Take a tour" item in the bottom utility section of **both** sidebar variants (traditional theme around line 345, new theme around line 700), placed directly above **Settings** and below **Accessibility**.

- Icon: `Sparkles` from `lucide-react` (matches the existing `TourLaunchButton` styling).
- Label: `Take a tour`.
- Behaviour: `onClick` calls `tour.start(0)` from `useTour()`.
- Styling: mirror the existing bottom-row buttons exactly (same `h-9`, padding, hover, muted-foreground tokens) for both expanded and collapsed states; in collapsed state use a `Tooltip` with `"Take a tour"`.
- Wire the existing `TourProvider` via `useTour()` (already exported from `@/contexts/TourContext`).

## Closing → re-opening flow

The tour already supports `tour.close()`, which sets `open: false` without losing the steps. The new sidebar entry simply calls `tour.start(0)` again, so users who close mid-tour can relaunch from the start at any time. No changes to `TourContext` are needed.

## Out of scope

- The floating `TourLaunchButton` stays as-is (first-run nudge). Its dismiss behaviour is unchanged.
- No changes to tour steps, content, or analytics.
- No new routes or pages.

Approve and I'll ship it.