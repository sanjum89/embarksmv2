## Refine the Adaptive Paths Sankey

Two real problems in the current chart:

1. **The five states all look the same.** Completed / Skipped / Microlearning / Emphasis / Not-yet-reached are encoded only by line weight + dash pattern in a single learner color. At a glance they read as "one ribbon with some texture" — you can't scan the chart and instantly see *what* the AI did.
2. **Column headers are a mess.** Module title + the long `ASSOCIATE_INVESTMENT_MANAGER` stage label collide horizontally with the next column and stack on top of each other vertically. With 6+ modules the whole header band turns into noise.

Plan below fixes both, **scoped to `src/components/team-home/AdaptivePathsSankey.tsx` only**. No data, no other components.

---

### 1. New visual encoding for adaptation states

Move from "all one color, different dash" to **state = color + shape**, with the learner's identity carried by a small avatar/label on the left rather than by the ribbon hue. This is the standard fix for Sankey-style adaptation diagrams and matches what the legend is trying to say.

| State | Encoding |
|---|---|
| Completed | Solid line, `--success` (green), filled circle node |
| In progress | Solid line, `--primary`, half-filled node |
| Skipped | Dashed line, `--muted-foreground` at low opacity, hollow node with diagonal slash |
| Microlearning inserted | Solid line, `--accent` (warm), node rendered as a small **diamond** with a `+` glyph |
| Emphasis | Solid **thicker** line, `--warning`, node rendered as a ring with inner dot |
| Reordered | Solid line, `--primary`, node rendered as a **curved arrow** glyph |
| Not yet reached | Very faint dotted line, no node |

Learner identity moves to:
- Left-side row label (already there) gets a small colored dot = learner color
- Ribbon itself uses the **state palette above**, not the learner palette

This means a manager scanning the chart sees instantly: "green = on plan, orange diamonds = AI added microlearning, dashed grey = AI skipped, thick yellow = AI emphasised." That's the whole point of the chart.

Hover/selection still highlights one learner's row (dim the others), so per-learner comparison still works.

### 2. Cleaner column headers

Current header per column = module title (truncated at 18 chars) + full stage slug (`ASSOCIATE_INVESTMENT_MANAGER`) underneath, both center-aligned, both wider than the column. Fix:

- **Drop the per-column stage label entirely.** Replace it with a single **stage band** above the columns that spans the contiguous run of columns sharing the same stage, rendered as a thin pill (e.g. "Associate IM · 6 modules"). One label per stage, not per module.
- **Module title**: keep one line, increase per-column width slightly (`COL_W` 160→176), truncate at ~14 chars with ellipsis, and rotate **−25°** so longer titles don't collide with neighbours. Full title stays available on hover (`<title>`).
- **Module index chip** (`M1`, `M2`, …) under each title in muted small caps so you can reference them in conversation without reading the full name.

Result: header band becomes "Stage pill row → angled module titles → spine nodes," much calmer.

### 3. Legend update to match

Rebuild the legend to mirror the new encoding (color swatch + shape glyph + label), grouped as:
- **On-plan**: Completed, In progress, Not yet reached
- **AI changes**: Skipped, Microlearning, Emphasis, Reordered

### Out of scope

- No changes to `LearnerOverlay`, `useManagerCohortData`, `AdaptivePathDrawer`, the toolbar/picker, hover/selection logic, or any other file.
- No new data fields. All encoding derives from the existing `status` + `pathChange.kind` already on each segment.

### Technical notes

- All colors via existing semantic tokens (`--success`, `--warning`, `--accent`, `--primary`, `--muted-foreground`); no hex.
- Stage bands computed by grouping `spineModules` on `progression_stage` into `[{stage, startIdx, span}]` and rendering one `<rect>` + `<text>` per group at `y = 4`.
- Module titles rendered with `transform={`rotate(-25 ${x} 22)`}` and `text-anchor="end"`.
- Node shapes: small helper `renderNodeGlyph(seg)` returning the right SVG primitive (circle / diamond / ring / arrow / slash) so the main render loop stays readable.
- `PADDING_TOP` grows from 44→64 to fit stage band + angled titles; `totalHeight` recomputed accordingly.
