## Plan

Change the sidebar tour callout so it behaves as a per-session attention prompt, independent of the existing "tour seen" flag.

### Behavior

1. On every page load, if the user is eligible (Clara/Theo) and the tour is not currently open, show the floating callout next to the "Take a tour" sidebar item.
2. Show it regardless of whether the user has progress in their Embark journey or has previously seen/started the tour.
3. The callout has a close (X) button. Clicking it hides the callout for the rest of the session.
4. Clicking the callout body starts the tour (and also hides the callout).
5. On a full page refresh, the callout returns. There is no localStorage persistence for this prompt.

### Technical notes

- Edit `src/components/tour/TourSidebarHint.tsx`:
  - Remove the `localStorage` read/write for `embark_tour_seen::<uid>` from this component (keep `TourWelcomeBanner`'s own usage intact).
  - Replace `seen` state with a simple in-memory `dismissed` state that defaults to `false`. Since React state resets on full page reload, this naturally satisfies the "until refresh" requirement.
  - Show the callout when `show && !dismissed && !tour.open`.
  - Keep the existing portal-based positioning beside the sidebar button so layout/alignment of the Settings icon is unaffected.
  - Keep the small ping dot on the icon while the callout is visible.
- No changes to `TourWelcomeBanner`, `AppSidebar`, or the tour context.
- No backend changes.

### Validation

- Load the app as Clara: callout appears next to the Tour sparkle icon on first render.
- Click X: callout disappears and does not return while navigating between routes.
- Refresh the page: callout reappears.
- Click the callout: tour starts and callout hides.