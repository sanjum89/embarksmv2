## Goal
Make the Adaptive Paths Sankey reflect the **real cohort modules** (not an 8-cell dummy overlay), group them by **meaningful stages** instead of one repeated role-slug band, and fix the **unreadable angled titles**.

Roster and Adaptive Paths will be guaranteed to stay in sync because both will read from the same live `modules[]` source.

---

## A. Correlate overlay cells with live modules (data fix)

**File: `src/data/managerDemoOverlay.ts`**

- Stop using `COHORT_MODULES_FALLBACK` as the source of truth for cell positions.
- Change `LearnerOverlay.cells` generation: instead of a hand-written 8-element array, each persona now defines a **progression *pattern*** (a recipe), e.g.
  - `{ completedThrough: 6, inProgressCount: 1, adaptations: { 'TECH-130': 'microlearning', 'BEH-220': 'skip_after_validation', ... } }`
- Build the actual `cells[]` at hook time by mapping over the **live `modules[]`** passed in from `useManagerCohortData`, keyed by `module_code`.
- `pathChanges[]` continues to reference real `module_code`s; any orphan changes (module not in live cohort) are silently dropped.
- Result: every learner row spans **all 28 real modules**, and adaptations always land on the correct cell regardless of catalog edits.

**File: `src/hooks/useManagerCohortData.ts`** (small)
- Pass live `modules` into the overlay materializer; expose the materialized overlay per learner.

---

## B. Real stage groupings (replace the meaningless single band)

**File: `src/data/managerDemoOverlay.ts`** (or a small helper next to it)

- Derive stage groups from `display_order` decade buckets present in the live data:
  - `10–90` → **Foundations · Books**
  - `100–199` → **Technical**
  - `200–299` → **Behavioural Skills**
  - `300–399` → **Compliance**
  - `400–499` → **Onboarding**
  - `500+` → **Stretch**
- Override each module's `progression_stage` with the bucket label before passing to the Sankey, so `stageGroups` in the chart produces 5–6 contiguous bands instead of one giant `Associate Investment Manager 18M` band.
- Drop the redundant top-level "Associate Investment Manager" wrapper line — the cohort title already lives in the page header.

If a future cohort happens to bucket into a single decade, the existing contiguous-run logic will naturally render one band — no special-case needed.

---

## C1. Readable module titles (lightest layout fix)

**File: `src/components/team-home/AdaptivePathsSankey.tsx`**

- Widen `COL_W` (e.g. 130/176 → **180/220**) so titles get breathing room.
- Replace the `-22°` rotated single-line title with a **horizontal two-line `<text>`** using two `<tspan>` rows:
  - Line 1: first ~22 chars
  - Line 2: next ~22 chars, with ellipsis if longer
  - Native `<title>` tooltip retains the full name on hover (already in place).
- Bump `TITLES_Y` and `PADDING_TOP` to fit two lines.
- Keep the `M1…M28` chip beneath the title as the compact reference.
- Stage band text stays uppercase but is now genuinely informative (Foundations, Technical, …).

No changes to ribbon rendering, legend, drawer, filters, or compare modes.

---

## Out of scope
- Roster heatmap visuals (already correct).
- Drawer copy, AI Decisions feed, Integrations tab.
- Changing how many modules render (still all of them, just readable).
- Any catalog/database edits.

---

## Files touched
- `src/data/managerDemoOverlay.ts` — pattern-based overlay + stage bucketing helper
- `src/hooks/useManagerCohortData.ts` — wire live modules into materializer, apply stage labels
- `src/components/team-home/AdaptivePathsSankey.tsx` — wider columns, two-line horizontal titles, taller header
