## Real module data + meaningful stage groups + readable horizontal titles

Three coordinated fixes so the Roster and Adaptive Paths tabs share the same real catalog and read cleanly.

### A. Project dummy progression onto the live module list (correlation fix)

The 8-module fallback (`COHORT_MODULES_FALLBACK`) is the root cause of the misalignment. Live cohorts have ~28 modules; the overlay was authored for 8 and indexed by position, so columns 1–8 show wrong-but-plausible data and columns 9–28 are silently blank.

Change `src/data/managerDemoOverlay.ts`:

- Replace each persona's hand-typed `cells: cells([...8 items...])` with a small **persona recipe** describing *behaviour*, not module count. Recipe shape (kept tiny on purpose):
  ```ts
  type PersonaRecipe = {
    completedThrough: number;      // 0..1, fraction of path treated as completed
    inProgressCount: number;       // how many modules sit "in_progress" right after
    skipCodes?: string[];          // optional explicit module_codes to mark skipped
    microCodes?: string[];         // optional explicit module_codes with microlearning
    emphasisCodes?: string[];      // optional explicit module_codes with emphasis
    scoreRange?: [number, number]; // band for synthetic scores
  };
  ```
- Export a new function `buildOverlayCells(modules: CohortModuleCol[], recipe: PersonaRecipe): ModuleCellOverlay[]` that:
  1. Walks the live `modules` array in order.
  2. Marks the first `floor(modules.length * completedThrough)` as `completed`, the next `inProgressCount` as `in_progress`, the rest as `not_started` (last few `locked` if behind a gate).
  3. Layers `skipCodes`/`microCodes`/`emphasisCodes` onto matching `module_code`s; codes not present in the live catalog are silently ignored.
  4. Generates synthetic scores within `scoreRange` for completed cells.
- `getDemoOverlay(employeeId)` becomes `getDemoOverlay(employeeId, modules)` and projects the recipe at call time.
- `useManagerCohortData` passes `liveModules` into `getDemoOverlay` so cells *always* match the spine.
- `pathChanges` already use `module_code`. Filter at hook time to drop changes whose code isn't in the live catalog (no orphan dots).
- Delete `COHORT_MODULES_FALLBACK` once nothing references it; the modules query already returns 28 rows for `assoc_im`.

Result: Roster columns = Adaptive Paths columns = live `catalog_modules`, forever. Demo personas keep their narrative shape (Sophie slow, Theo fast, etc.) regardless of how the catalog evolves.

### B. Real stage groups from `display_order` decade buckets

Live `progression_stage` is just the role slug repeated, so it carries no signal. Instead, derive stage from `display_order`:

```text
  10–99   → Foundations
 100–199  → Technical
 200–299  → Behavioural Skills
 300–399  → Compliance & Standards
 400–499  → Onboarding
 500+     → Stretch
```

Add a tiny pure helper `deriveStageBuckets(modules)` in `src/lib/cohortStageBuckets.ts` returning `[{ label, startIdx, span }, ...]`. The Sankey replaces the current `stageGroups` (which grouped on the meaningless `progression_stage` field) with this output. **If the result is a single bucket, render no stage band at all** — fixes the "ASSOCIATE INVESTMENT MANAGER · 8 MODULES" noise complaint.

Use the same helper in the Roster heatmap header so both tabs show the same group labels above their columns.

### C1. Horizontal, two-line titles (readability fix)

Drop the `−22°` rotation entirely. New header geometry per column:

- `COL_W` raised to `~210px` (was 176).
- Title rendered horizontally with manual two-line wrap: split `module_title` on the nearest space past ~18 chars; render line 2 truncated with ellipsis if needed. Full title in `<title>` tooltip.
- `M{n}` chip moves *under* the title (small caps, muted), unchanged.
- `PADDING_TOP` recomputed for the taller header; SVG width grows accordingly and inherits the existing `overflow-x-auto` scroll.

Cohorts of 28 modules will scroll horizontally — that's correct and honest. The old angled labels were trying to hide that the chart needs more room than it has.

### Out of scope

- No changes to `AIChangesFeed`, `IntegrationsTab`, `LearnerDrawer`, `AdaptivePathDrawer`, the toolbar/picker, hover/selection logic, or any colour/state encoding from the previous turn.
- No new database schema; everything stays read-only against `cohorts` / `catalog_modules` / `cohort_enrollments`.
- No "view all / collapse" affordance for very wide cohorts — separate decision.

### Files touched

1. `src/data/managerDemoOverlay.ts` — persona recipes + `buildOverlayCells` + new `getDemoOverlay(id, modules)`; remove `COHORT_MODULES_FALLBACK`.
2. `src/hooks/useManagerCohortData.ts` — pass `liveModules` to `getDemoOverlay`; filter `pathChanges` by present `module_code`.
3. `src/lib/cohortStageBuckets.ts` — new helper.
4. `src/components/team-home/AdaptivePathsSankey.tsx` — use new buckets, hide band when single, switch to horizontal two-line titles, widen columns.
5. `src/components/manager-hub/RosterHeatmap.tsx` — add the same stage group strip above its columns (only when >1 bucket).
