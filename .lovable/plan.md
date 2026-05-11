Two unfinished pieces from earlier — bundling them so both ship together.

## Part 1 — Restyle `/manager/programs` to match the old Program Context look

Keep the URL `/manager/programs`, keep all current functionality (list, create, detail, learner roster, assessment config, tags, progress). **Only** swap the visual styling to mirror `src/components/manager/ProgramContextPanel.tsx`.

### Design language to adopt

- **Containers**: `rounded-xl border border-border bg-background p-4` cards stacked with `mb-5` rhythm. No big colored hero blocks, no full-bleed gradient banners.
- **Headers**: small icon (`h-4 w-4 text-primary`) + `font-display text-lg font-bold` title, with a quiet `text-sm text-muted-foreground` subtitle underneath.
- **Section titles inside cards**: `text-sm font-medium text-foreground` with `mb-3`.
- **Body copy**: `text-xs text-muted-foreground leading-relaxed`.
- **Badges/chips**: shadcn `Badge` `variant="secondary" | "outline"` at `text-[0.65rem]` / `text-[0.6rem]`. Replace hand-rolled `emerald-*`, `amber-*`, `sky-*`, `orange-*` classes with semantic tokens (`primary`, `success`, `warning`, `destructive`, `muted`) via small helper maps.
- **Lists**: tight rows, `hover:bg-secondary/50`, small avatar circles `h-7 w-7 bg-primary text-primary-foreground` with initials.
- **Buttons**: default shadcn primary; full-width for the main save/CTA.
- **Spacing**: page wrapper `p-6` with a single column max-width (`max-w-3xl`) instead of wide multi-column dashboards.

### Files to change

`src/pages/ProgramContextPage.tsx` — restyle the three views in place:

- **List view**: stacked column of `rounded-xl border` cohort cards. Each card: icon + cohort name (display font), one-line description, secondary badges (status / learner count / module count), inline progress bar, chevron to open detail. Page top: compact header (`Layers` icon + "Cohorts" + count subtitle) and right-aligned `+ New cohort` button.
- **Detail view**: mirror the panel structure — About card, Assessment Configuration card (slider + adaptive-skip lines), Training Chapters card (checkbox list), Final Assessment card, Assigned Learners card with avatar rows, plus a Learner Progress card with tag chips (recolored to semantic tokens) + progress bar. `BackButton` at top.
- **Create view**: same card pattern — one card per logical group (Basics, Skill target, Learners, Schedule), full-width primary button at the bottom.

No changes to routes, data, mock, contexts, `ProgramContextPanel`, or `ManagerCohortHub`. No `index.css` / tailwind token edits.

## Part 2 — Adaptive Paths Sankey on Team Home

A new section under the existing "Module progress" heatmap card on `/team` (`src/pages/TeamMode.tsx`). Reads from the same `managerDemoOverlay` data (`pathChanges`, `cells`) plus the `catalog_modules` baseline spine.

### Sankey diagram — `AdaptivePathsSankey.tsx`

- **Spine**: standard cohort path from `catalog_modules` ordered by `display_order`.
- One ribbon per learner flowing left → right through columns.
- Segment styles:
  - solid primary = completed
  - solid muted-primary = in progress
  - thin dashed = skipped
  - solid accent + dot = micro-learning
  - chevron arrows = reordered
  - thicker stroke = emphasis
  - ghost = not yet reached
- Hover dims other ribbons; tooltip shows module title, kind, and `pathChange.reason`.
- Vertical "today" marker for cohort calendar.

### Toolbar

- Learner chips (up to 4 selected; default = top 3 by adaptation count).
- Compare mode: *Stack* (default), *Side-by-side* (2 learners), *vs Baseline* (1 learner).
- Filter: All changes / Skips only / Microlearning only / Reorders only.
- Legend.

### Click-through detail — `AdaptivePathDrawer.tsx`

- **Why**: `pathChange.reason`, `evidence[]`, confidence + risk badges.
- **What changed**: original vs new form from `catalog_modules` + `pathChange.kind`.
- **Approve** (only when `needs_approval = true`, logs `agent_one_event` of type `path_change_approved`) and **Revert** (always available, logs `path_change_reverted`, marks cell as `would_be_default`).
- Both optimistic UI on in-memory overlay; no DB writes.
- "View full learner story" opens the existing learner drawer.

### Data + state

- Spine from `catalog_modules` filtered by cohort domain/role.
- Per-learner segments from `LearnerOverlay.cells` + `pathChanges`.
- Approve/revert tracked in a `useState` map keyed by `pathChange.id`.

### Files

- New: `src/components/team-home/AdaptivePathsSankey.tsx`, `src/components/team-home/AdaptivePathDrawer.tsx`.
- Edited: `src/pages/TeamMode.tsx` (insert section after the Module progress card).

### Out of scope (both parts)

- No DB schema changes, no route changes, no business-logic changes outside local approve/revert state.
- No persisting beyond session.
- No changes to the heatmap or existing learner drawer.
- True volumetric Sankey (per-learner ribbons only, not weighted volumes).
