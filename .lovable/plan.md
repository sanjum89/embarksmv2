# Cohorts page — editorial redesign

Scope: just the **list view** in `src/pages/ProgramContextPage.tsx` (`CohortList`). Create wizard and detail view stay as-is.

## Why the current design feels weak

1. **No top-of-page signal.** Title + subtitle + button is bare. Nothing tells the manager what's happening across the program.
2. **Cards are crowded but low-info.** Title, status badge, description, progress bar, meta row, alert chips, and avatars all stacked with no hierarchy.
3. **Plurals/typos.** "1 targets" reads broken.
4. **Two-column slab grid** wastes vertical scan rhythm — every card looks identical.
5. **Avatars all use the same dark primary** — no individuality.
6. **Filter pills only.** No search, no sort, no count.
7. **Status semantics are invisible.** A draft cohort and a 100% completed cohort look like the same card.

## New design

```text
┌─ Back ────────────────────────────────────────────────────────────────┐
│ Cohorts                                              [ + New Cohort ] │
│ 4 cohorts · 9 active learners · 45% avg progress · 2 need attention   │
├───────────────────────────────────────────────────────────────────────┤
│ [Search cohorts…]            All · Active · Draft · Completed   ⇅Sort │
├───────────────────────────────────────────────────────────────────────┤
│ ▍ Apple L1 Support — March 2026          active           ⌃ 54%   ›  │
│ ▍ Onboarding cohort for new Apple L1 …                               │
│ ▍ ▰▰▰▰▰▰▱▱▱▱▱▱  • 4 learners • 1 target • Mar 1, 2026 • ★1 ⚠1     │
│ ▍ ◉ ◉ ◉ ◉                                                            │
└───────────────────────────────────────────────────────────────────────┘
```

### 1. Hero header (replaces the bare title row)

- Left: `Cohorts` title (font-display, 2xl) + subtitle.
- Below subtitle: a **single stat line** computed from the data: total cohorts · active learners (sum of `assignedLearnerIds` across `active` cohorts) · average progress (mean of avg progress across non-draft cohorts) · learners flagged `at_risk`/`needs_attention`. Muted text, dot separators.
- Right: keep `+ New Cohort` button.

### 2. Toolbar (single row)

- Left: search input (filters on cohort name + description, case-insensitive). Width `~280px`, with leading `Search` icon.
- Middle: existing status filter pills (All / Active / Draft / Completed) — keep colors, slightly smaller.
- Right: small **Sort** select (`Recent`, `Progress`, `Name`, `Start date`) as a borderless trigger with a chevron.
- Toolbar gets `border-b border-border/60 pb-3 mb-4` for separation.

### 3. Card redesign — single column, full-width, editorial rows

Switch from `grid-cols-1 md:grid-cols-2` to a single-column `space-y-3` list. Cards become wider, easier to scan, and accommodate richer detail without crowding.

Per card structure:

```
[status rail | icon] Title                          status pill   54%  ›
                     1-line description (line-clamp-1)
                     ━━━━━━━━━━━━━━━━━━━━━━━━━ thin progress
                     4 learners · 1 target · Due Mar 1  ·  ★ 1 rising · ⚠ 1 at risk
                     ◉ ◉ ◉ ◉  +0
```

Spec:
- **Left status rail**: a 3px tall vertical bar at `inset-y-0 left-0` colored by status — emerald (active), primary (completed), muted-foreground/40 (draft). Replaces the chip-only status signal so cards differ at a glance.
- **Icon tile** (40px) keeps `Layers` but background tints with status (emerald-tinted for active, primary-tinted for completed, muted for draft).
- **Title**: font-display, base, semibold; `truncate`.
- **Status pill**: small uppercase 10px pill, color-matched to the rail.
- **Big % on the right** (text-2xl tabular-nums) — the most important glanceable signal — replaces the inline "Overall Progress" prose.
- **Description**: muted, `line-clamp-1` (was 2) — the title and stats already do the heavy lifting.
- **Progress bar**: `h-1`, full width, no label above (% is up top).
- **Meta row**: keep icons but **fix plurals**: `learner / learners`, `target / targets`. Format date with `toLocaleDateString(undefined, { month: 'short', day: 'numeric' })` → `Mar 1, 2026`. Drop the meta row entirely for **draft** cohorts that have no learners (just show "No learners assigned yet").
- **Star/at-risk chips**: move into the meta row inline (after the date) with the same icons, but render labels `1 rising`, `2 at risk` for clarity instead of bare numbers.
- **Avatars**: hashed background color per learner name (same hash util pattern used in `team-home/Avatar.tsx`) instead of all primary; size 6 (24px); show first 6, then `+N` chip.
- **Hover**: `hover:bg-muted/30 hover:border-primary/40 hover:shadow-sm`. ChevronRight slides 2px right.
- **Card padding**: `p-5`. **Whole card is a button** as before.

### 4. Empty / filtered-empty states

- No cohorts at all: large icon, "No cohorts yet", "Create your first cohort to start tracking learner cohorts together", primary `+ New Cohort` button.
- Filter/search returns nothing: small inline `No cohorts match your filters` with a `Clear filters` link button (resets search + filter to All).

### 5. Loading/animation

Keep existing framer-motion stagger but change to subtle `y: 6, opacity: 0` → `y: 0, opacity: 1` with `delay: i * 0.04`.

## Files

- **Edit only**: `src/pages/ProgramContextPage.tsx` — rewrite the `CohortList` function (lines ~101–209) and add a small local `hashColor(name)` helper (or import the existing one from `@/components/team-home/Avatar`). Add `useState` for `search` and `sort`. Reuse imports already present (`Search`, `Calendar`, `Star`, `AlertTriangle`, etc.); no new dependencies.

No data-shape, route, or business-logic changes. Create wizard, detail view, and downstream consumers untouched.

## QA after build

- Render at desktop (1280) and tablet (834) — single column reads cleanly at both; nothing overflows.
- Check all four current cohorts: active, completed, draft (no learners), draft (with learners).
- Verify "1 target" / "2 targets" / "0 targets" pluralization.
- Search: typing `apple` filters to the two Apple cohorts; clearing restores all.
- Sort: switching to `Progress` puts 100% (Jan 2026) on top, 0% (draft) on bottom.
- Filter pills still work and combine with search.
- Status rail color is visible at the very left edge of each card; not clipped by the rounded corner.
