## What's there today

- `src/components/tour/TourLaunchButton.tsx` — the floating pink/primary "Take the tour" pill at the bottom-left, mounted once in `AppLayout.tsx`.
- `src/components/layout/AppSidebar.tsx` — already has a permanent "Take a tour" sidebar item (Sparkles icon → `tour.start(0)`), both in expanded and collapsed sidebar variants.
- `src/components/tour/TourWelcomeBanner.tsx` — a separate bottom-right welcome card; not what the user is referring to.
- `useShowTourEntryPoints` gates all of this to Clara (`rb-l6`) and Theo (`rb-l3`).

## Change

1. **Remove the floating pill.**
   - Delete `src/components/tour/TourLaunchButton.tsx`.
   - Remove its import and `<TourLaunchButton />` mount from `src/components/layout/AppLayout.tsx`.

2. **Replace it with a first-login popover anchored to the sidebar "Take a tour" item.**
   - New component `src/components/tour/TourSidebarHint.tsx` that wraps the sidebar's "Take a tour" trigger button in a shadcn `Popover` (open by default on first login, anchored to the same button).
   - Copy: short headline "Start here" + one-line "Take a 2-minute tour to see how Embark works." + two buttons: **Start tour** (calls `tour.start(0)` and dismisses) and **Later** (dismisses).
   - Has the same little pulsing dot accent the current pill uses, so the user's eye still gets pulled to it — just on the sidebar item itself instead of floating in the canvas.
   - Visibility rules (all must be true):
     - `useShowTourEntryPoints()` → Clara/Theo only.
     - `tour.open` is false.
     - Not previously dismissed — reuse the existing `embark_tour_seen::{userId}` localStorage key already used by `TourWelcomeBanner`, so dismissing in one place dismisses both and the existing welcome card stays consistent.
   - Auto-closes if the user clicks the "Take a tour" item directly, or starts the tour, or dismisses.

3. **Sidebar integration**
   - In `AppSidebar.tsx`, wrap the two existing "Take a tour" buttons (lines ~388–409 for the desktop sidebar and ~772–791 for the mobile sheet) with `TourSidebarHint` so the popover anchors correctly in both. No layout/markup change to the sidebar itself.
   - When the sidebar is **collapsed**, the popover still anchors to the icon-only button (side="right").

## Out of scope

- No changes to tour content, steps, or `TourContext`.
- No changes to `TourWelcomeBanner` behaviour; it remains as-is (same dismissal key means it won't double-prompt after the popover is dismissed).
- No changes to which personas see the tour.

## Files touched

- delete: `src/components/tour/TourLaunchButton.tsx`
- edit: `src/components/layout/AppLayout.tsx` (remove import + mount)
- create: `src/components/tour/TourSidebarHint.tsx`
- edit: `src/components/layout/AppSidebar.tsx` (wrap two "Take a tour" buttons)
