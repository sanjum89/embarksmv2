## Move "Take the tour" to a global pop-out near the profile chip

Today `TourLaunchButton` is `fixed top-4 right-4`, which overlaps page modules (e.g. the cohort hub header). Move it to the bottom-left, anchored just outside the sidebar profile section, with an animated entrance so users read it as a product-wide affordance.

### Change

Edit **`src/components/tour/TourLaunchButton.tsx`**:

- Reposition: `fixed bottom-4 z-[9000]`, with `left: calc(var(--sidebar-width, 14rem) + 0.75rem)` so it sits flush against the sidebar (and shifts automatically when the sidebar collapses to icon mode via the shadcn `--sidebar-width` CSS var).
- Animated entrance: on mount, delay ~350ms then transition `-translate-x-6 opacity-0` → `translate-x-0 opacity-100` over 500ms (slide-in from behind the sidebar, like it's emerging from the profile chip).
- Attention hint: wrap the pill in a relative container with an `animate-ping` halo (`bg-primary/40`) behind it; pill itself gets `hover:scale-105` for a subtle lift.
- Dismissible: small `X` button inside the pill (right side) that sets a local `dismissed` state and hides the pop-out for the session (no persistence). Keeps Cmd-style "I see it, go away" behaviour.
- Keep the existing visibility guard (`useShowTourEntryPoints` + `tour.open`) and the click handler (`tour.start(0)`).

No changes to `AppLayout.tsx` (it already renders `<TourLaunchButton />` once globally) or to any page components — removing the prior page-level overlap automatically.

### Out of scope

- Persistent "don't show again" storage.
- Tour content / steps.
- Sidebar markup changes.
