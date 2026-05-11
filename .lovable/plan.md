# Plan: Adaptive Paths in cohort hub + cohort picker restyle

## 1. Move Adaptive Paths into the cohort hub

**Remove from Team Home** (`src/pages/TeamMode.tsx`):
- Drop the `AdaptivePathsSankey` section and its import. Team Home keeps roster, action queue, cohorts card, and module heatmap only.

**Add to cohort hub** (`src/pages/ManagerCohortHub.tsx`):
- Add a new tab `Adaptive Paths` to the existing `Roster / AI Changes / CPD` tab strip, sitting between AI Changes and CPD.
- Tab content renders `AdaptivePathsSankey` using the cohort's `learners` and `modules` from `useManagerCohortData`, wired to `openLearner` for drawer.
- Pending-adaptation count badge already lives on AI Changes; no duplicate badge here.

**Use more screen real estate inside the hub**:
- The hub page is currently full-width (no `max-w` wrapper). Sankey will inherit that, giving it ~600px more horizontal room than on Team Home.
- Inside `AdaptivePathsSankey`:
  - Add an optional `dense?: boolean` prop (default false). When false (cohort hub usage), increase the SVG row height, column width, and toolbar spacing so ribbons read clearly across the full width.
  - Lift the learner picker to allow up to 6 selected learners (was 4) when `dense=false`.
  - Toolbar wraps onto one row at >=lg, two rows below.
- Team Home no longer renders this component, so existing call sites are unaffected.

## 2. Restyle the cohort picker (`/manager/cohorts`)

`src/pages/ManagerCohortPicker.tsx` still uses the older "card grid with raw bg-card tiles" look. Bring it in line with the Team Home / Program Context language used elsewhere:

- Page wrapper: `max-w-[1400px] mx-auto`, consistent `p-4 sm:p-6 lg:p-8`.
- Header block: same pattern as `TeamHero` lite — `font-display text-2xl font-bold` title, muted subtitle, and a small pulse-style stat strip showing `Cohorts`, `Active learners`, `Needs attention` derived from overlays where available (fallback zeros).
- Cohort tiles:
  - Use `rounded-xl border border-border bg-background` (not `bg-card`) to match panel language.
  - Two-line layout: title + role code chip on top, footer row with `Layers` icon + learner count + progress pill + chevron.
  - Hover: `hover:border-primary/40 hover:bg-muted/30`, subtle transition.
  - Grid: `sm:grid-cols-2 xl:grid-cols-3`, `gap-4`.
- Empty/loading states use the same muted-foreground typography as cohort hub.

No route or data-shape changes; visual + structural only.

## Files to touch

- `src/pages/TeamMode.tsx` — remove Sankey section + import.
- `src/pages/ManagerCohortHub.tsx` — add `Adaptive Paths` tab and render Sankey.
- `src/components/team-home/AdaptivePathsSankey.tsx` — add `dense` prop, larger default sizing, allow up to 6 learners when not dense.
- `src/pages/ManagerCohortPicker.tsx` — restyle to match panel design language.

## Out of scope

- No changes to `AdaptivePathDrawer`, overlay data, or routing.
- No new business logic; presentation only.
