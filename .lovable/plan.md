# Adaptive Paths — refine for scale

Refactor `src/components/team-home/AdaptivePathsSankey.tsx` so it stays readable from 3 to 100+ learners and from 8 to 50+ modules. Three focused changes, each addressing one of the issues called out.

## 1. Scalable learner picker

Replace the wrap-everywhere chip row with a compact, searchable picker that scales:

- **Selected lane** (left): only the actively-charted learners as removable color-dot chips, in selection order. Cap stays at 6 (4 in dense), with a small `6/6` counter.
- **"Add learner" popover**: button opens a `Command` (cmdk) popover containing
  - search input,
  - quick filters: `Most adapted`, `At risk`, `On track`, `A–Z`,
  - virtualized list of all learners with checkbox + adaptation count badge,
  - bulk actions: `Select top 5 most adapted`, `Clear`.
- **Overflow stays out of the toolbar.** Unselected learners never render as chips, so 100 learners = same toolbar footprint as 5.
- Persist selection in component state only (no URL/store changes in scope).

## 2. Clearer status & adaptation encoding

Stop relying on stroke-style differences (dashed vs solid vs thick). Switch to a color + icon system that reads at a glance:

- **Segment color = adaptation kind**, one token per kind:
  - Completed (no adaptation) = `--success`
  - Skipped after validation = `--warning`
  - Microlearning = `--accent` (info-ish)
  - Emphasis = `--primary`
  - Reordered = `--muted-foreground` w/ arrow glyph
  - In progress = same color as kind, lower opacity + animated dash
  - Not yet reached = thin neutral line at 18% opacity
- **Node glyph encodes the adaptation** (small inline SVG icon centered on the node): `Check`, `FastForward` (skipped), `Zap` (micro), `Flame` (emphasis), `ArrowLeftRight` (reorder). Falls back to a plain dot when no adaptation.
- **Hover state**: segment thickens, tooltip shows `<Module> · <Adaptation> · <Reason snippet>`.
- **Legend** rewrites to color swatches with the matching icon, so learners can map "yellow square = skipped" without studying line patterns.
- Keep colorblind safety: each kind also has a unique icon and label tooltip, so color is not the only carrier.

## 3. Group modules by stage with drill-down roll-ups

Avoid the "every chapter shown" wall. Use the existing `progression_stage` (foundation / core / advanced / mastery) as the top level:

- **Default (collapsed)**: render one column per stage instead of one per module. For each learner × stage cell, render a **stack of mini-pills** that summarises what happened inside the stage:
  - `5 done · 2 skipped · 1 micro` rendered as a horizontal mini-bar (segments colored by kind 2 above), with counts only shown for non-zero kinds.
  - Tooltip lists the modules inside, grouped by kind.
- **Expand on click**: clicking a stage header expands it inline to the existing per-module column view *only for that stage*. Other stages stay rolled up. Multiple stages can be expanded simultaneously; an `Expand all` / `Collapse all` toggle sits in the toolbar.
- **Persistence**: expansion state lives in `useState<Record<stage, boolean>>`, default all collapsed.
- **No data-shape change**: roll-ups are derived in the existing `rows` memo by grouping `segments` by `module.progression_stage`.
- Drop the "Showing first N of M modules" truncation — with roll-ups the full module set fits.

## Toolbar layout after the change

```text
[Learners: chip chip chip + Add (24)] [Expand all]   [Stack | Side | Baseline]  [All | Skips | Micro | Reorders]
```

## Out of scope

- No changes to `LearnerOverlay`, `AiPathChange`, `useManagerCohortData`, or the drawer.
- No new routes, edge functions, or DB migrations.
- Side-by-side and vs-Baseline modes keep their current semantics; they just inherit the new visual encoding and grouping.

## Files to touch

- `src/components/team-home/AdaptivePathsSankey.tsx` (main refactor)
- New helper: `src/components/team-home/AdaptivePathsLearnerPicker.tsx` (cmdk popover)
- New helper: `src/components/team-home/AdaptivePathsStageCell.tsx` (roll-up mini-bar)
- Reuse existing `Command`, `Popover`, `Badge` shadcn primitives — no new deps.
