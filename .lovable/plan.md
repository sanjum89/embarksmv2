# Adaptive Paths Sankey — Track focus + learner picker overhaul

Scope: `src/components/team-home/AdaptivePathsSankey.tsx` (single file; consumed only by `ManagerCohortHub`).

## 1. Track focus (stages as tabs)

Replace the static stage band row with a clickable **track selector** above the SVG:

```
[ All tracks ]  [ Foundations · 5 ]  [ Core · 12 ]  [ Advanced · 8 ]  [ Mastery · 3 ]
```

- Derived from existing `stageGroups` (no data change). Order = first appearance in the module spine.
- "All tracks" is the default and renders today's full path.
- Selecting a track filters `spineModules` to that stage's modules only, so the diagram zooms into a much wider column-per-module view (~easier read of each adaptation).
- The in-SVG stage band stays as a subtle title for the active track; when "All" is selected, all bands render as today and each band is **also clickable** (clicking a band switches to that track tab — same state).
- Per-track summary chip shown next to the tab name: `e.g. Foundations · 5 mod · 3 skips`. Counts are computed across currently-selected learners so the user sees where adaptation is actually happening.

## 2. Remove "Side-by-side"

Compare modes collapse to **Stack** (default) and **vs Baseline**. Drop the `"side"` branch from `CompareMode`, the toolbar button, and the `rows.slice(0, 2)` slicing. Stack now always honors the full selection.

## 3. New learner picker

Replace the inline pill bar with a single **searchable multi-select dropdown** (shadcn `Popover` + `Command`):

- Trigger: `[ + Add learners (3 / 7) ]` with the selected learners shown as removable chips next to it.
- Dropdown lists every learner with: avatar dot · name · job title · **status tag** (color-coded).
  - `rising_star` → emerald "Rising star"
  - `on_track` → blue "On track"
  - `needs_check_in` → amber "Needs check-in"
  - `at_risk` → red "At risk"
- Max 7 selected (`MAX_SELECTED = 7`). Selecting an 8th disables further options until one is removed.
- Search filters by name + title.
- Selected chips show `Clara — Rising star` style: name + small status tag in the same chip, plus an × to remove.
- Inside the diagram, the **left learner label** also gets a status tag pill next to the name (same color tokens).

A small helper:
```ts
const STATUS_META: Record<LearnerStatus, { label: string; cls: string }> = {
  rising_star:     { label: "Rising star",     cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  on_track:        { label: "On track",        cls: "bg-blue-500/15    text-blue-700    border-blue-500/30" },
  needs_check_in:  { label: "Needs check-in",  cls: "bg-amber-500/15   text-amber-700   border-amber-500/30" },
  at_risk:         { label: "At risk",         cls: "bg-red-500/15     text-red-700     border-red-500/30" },
};
```
(Status read from `overlay.status` — already present on `LearnerOverlay`.)

## 4. Default selection

Unchanged: top 3 by `adaptationCount(overlay)` (already implemented). With max bumped to 7, users can add more.

## 5. Toolbar layout after changes

```
Row 1:  Learners  [chips…]  [+ Add (3/7)]                          [ Stack | vs Baseline ]
Row 2:  Track   [All]  [Foundations·5·3 skips]  [Core·12·1 micro]  …    [ All | Skips | Micro | Reorders ]
```

The adaptation-kind filter (All/Skips/Micro/Reorders) stays as-is.

## 6. Empty state

If selection drops to 0, render a centered placeholder ("Add learners to see how the AI tailored their path") inside the SVG area instead of a broken-looking diagram.

## Out of scope

- No changes to `managerDemoOverlay` data, `AdaptivePathDrawer`, or other tabs in the cohort hub.
- Geometry constants (`COL_W`, `ROW_H`, node glyphs, ribbons) stay the same; only the input `spineModules` changes when a track is selected.
- No new routes, no backend touches.

## Files

- **edit** `src/components/team-home/AdaptivePathsSankey.tsx` — track tabs, picker dropdown, status tags, remove side-by-side, support 7 learners.

That's the whole change.
