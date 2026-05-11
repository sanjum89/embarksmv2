# Fix: Adaptive Paths data must match Roster

## Root cause

Both views receive the same `learners` and live `modules` (29 catalog rows like `bk1.*`, `tk1.*`).
- `RosterHeatmap` reads overlay cells **by index** — `o.cells[i]`. Overlays only have 8 cells, so the first 8 catalog columns get statuses/adaptations and the rest render as "not started". This is what the user sees and treats as truth.
- `AdaptivePathsSankey` reads overlay cells **by `module_code`** (`cellMap.get(m.module_code)`). Overlay codes are `mod.assoc_im.*` and never appear in the live catalog, so nothing matches → ribbons show all-grey with no AI adaptations and no nodes for path changes.

## Fix

Align the Sankey's lookup with the heatmap so the same data drives both:

1. **`src/components/team-home/AdaptivePathsSankey.tsx`** — change segment construction:
   - Drop the `module_code` map for overlay cells.
   - Iterate the spine `modules` by index and read `overlay.cells[i]` directly (same as `RosterHeatmap`).
   - For `pathChanges`, also resolve by index: build a `Map<positionInOverlay, AiPathChange>` from the overlay's own `cells` order (overlay `pathChanges[].module_code` matches overlay `cells[].module_code`), then attach to the same index `i`.
   - Tooltip and drawer continue to show the overlay's original `module_title` (from the `pathChange` itself) so labels remain correct.

2. **Module column count**: cap the rendered spine to `min(modules.length, overlay.cells.length)` so the diagram doesn't carry 21 trailing empty columns. Use the live `module_title` for labels (matches the heatmap headers). Add a small `"showing first N of M modules"` hint in the toolbar when truncation happens.

No data-layer or schema changes; `useManagerCohortData`, overlays, and the heatmap are untouched. Roster behavior stays exactly as-is.

## Out of scope

- Reconciling overlay `module_code`s with the real catalog (would need overlay rewrite).
- Changing `RosterHeatmap` lookup semantics.
