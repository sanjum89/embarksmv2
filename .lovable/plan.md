# Redesign: Team Home — a rich, editorial command centre

## What's wrong with the current page

- **No team roster.** The single biggest gap: the manager can't actually see their 9 direct reports. Just a "Talent Signals" sliver showing 2–3 people.
- **Raw IDs everywhere.** Cards display `rb-l1`, `rb-l2` instead of "Sophie Linden", "Maya Holloway" — names are available via `normalizedAccount.employeesById[id]`.
- **Flat 3-column layout.** Three equally-weighted cards (Talent Signals / Recommended actions / Cohorts) compete for attention. No hierarchy.
- **Generic KPI strip.** Plain numbers, no trend, no colour coding, no link to deeper view.
- **Quick-action buttons** stranded at the bottom feel like an afterthought.
- **Cramped + low-density.** Lots of whitespace doing nothing; nothing to actually do.

## The redesigned page (single scrollable column, structured like an editorial dashboard)

```text
┌──────────────────────────────────────────────────────────────────┐
│  HERO HEADER                                                     │
│  Team Home · Julian Ashcombe · Investment Management Director    │
│  "9 associates · 2 rising · 2 need attention · 4 actions queued" │
│  [ Schedule 1:1 ]  [ Send check-in ]  [ Action Centre → ]        │
├──────────────────────────────────────────────────────────────────┤
│  PULSE STRIP — 4 stat tiles with sparkline + delta + tone        │
│  Active learners · Avg progress · Rising stars · Needs attention │
├──────────────────────────────────────────────────────────────────┤
│  TWO-COLUMN BODY  (8 / 4 grid on lg)                             │
│  ┌──────────────────────────────────┐ ┌──────────────────────┐   │
│  │ TEAM ROSTER (the new centerpiece)│ │ ACTION QUEUE         │   │
│  │ Sortable table-cards, 1 per      │ │ Top 5 high-severity  │   │
│  │ direct report:                   │ │ items, learner name, │   │
│  │  ┌── Avatar + name + title  ────┐│ │ severity dot, why,   │   │
│  │  │ Status pill   Progress ▓▓░░  ││ │ → opens drawer       │   │
│  │  │ Last activity · CPD 14/35    ││ │                      │   │
│  │  │ Headline story (1 line)      ││ │ ─────                │   │
│  │  │ [Open profile] [Message]     ││ │ MY COHORTS           │   │
│  │  └──────────────────────────────┘│ │ Cohort cards w/      │   │
│  │  Filter: All / Rising / Risk /   │ │ pct, due date,       │   │
│  │          On track / Check-in     │ │ learner count        │   │
│  │  Sort: Status · Progress · Name  │ │                      │   │
│  └──────────────────────────────────┘ └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  TEAM PROGRESS HEATMAP  (full-width)                             │
│  Reuses RosterHeatmap — 9 learners × 8 modules                   │
└──────────────────────────────────────────────────────────────────┘
```

## Section-by-section spec

### 1. Hero header (replaces the small `<h1>` block)
- Two-line layout: small eyebrow ("Team Home"), large display title with the manager's name pulled from `useUser()`/account, subtitle that reads as one sentence sourced from KPIs ("9 associates · 2 rising stars · 2 need attention · 4 actions queued").
- Quick-action buttons (Schedule 1:1, Send check-in, Action Centre) move up here — primary on the right, ghost styled, never wrapping awkwardly because they live in a `flex-wrap gap-2` row that breaks under the title on narrow widths.

### 2. Pulse strip (replaces the KPI strip)
- 4 tiles in a `grid-cols-2 md:grid-cols-4` grid. Each tile: tiny uppercase label, big number, a one-line micro-stat in muted text ("avg 47%", "+3 this week"), and a coloured left border or small icon chip — emerald / amber / rose / primary using semantic tokens, no raw colours.
- Tiles are `Card`s with `p-5`, fixed min-height, `truncate` on micro-stat text to guarantee no overflow.

### 3. Team Roster (the new headline section)
- One row per direct report (all 9 from `accountDefaults.demoAccount` whose `reportsTo === currentManagerEmployeeId`, falling back to all `LearnerOverlay` entries for the demo).
- Card row layout (NOT a dense table — closer to a Linear-style list):
  - **Left:** circular avatar (initials over a tinted background derived from name hash for consistent colour), name (`text-sm font-semibold`), title (`text-xs text-muted-foreground`).
  - **Middle:** `LearnerStatusBadge`, then a 1-line headline (`truncate` with hover tooltip for full).
  - **Right:** progress block — slim 4px bar showing `cells.filter(completed).length / cells.length`, percent number, and a secondary metric (CPD `hours_logged/hours_required` as a small chip with `at_risk`/`on_track` tone).
  - **Far right:** kebab/inline actions — "Open" (opens existing `LearnerDrawer`) and "Message" (toast for now).
- Sort + filter bar above the list:
  - Filters as toggle pills: `All · Rising · At risk · Needs check-in · On track` (counts in subscript).
  - Sort dropdown: Status, Progress, Last activity, Name.
- Empty / search state for cleanliness.
- Each row click opens the existing `<LearnerDrawer>` with the matching overlay (logic already in current page — preserve and extend).

### 4. Action Queue (right rail, top)
- Same data source as today's "Recommended actions" but redesigned:
  - Severity rendered as a **left coloured rail** on the card (4px) instead of a Badge — high = rose, medium = amber, low = muted.
  - Show learner **name** (not ID), action title, and a one-line "why" excerpt.
  - Max 5 items, with an "Open Action Centre →" link at the bottom.
- Empty state: muted icon + "Nothing pressing right now."

### 5. My Cohorts (right rail, bottom)
- Each cohort as a card: title, role-cohort code as a small chip, due date if any, a 6-week mini progress bar, learner-count pill.
- Falls back to the demo Investment Management Readiness cohort like today.

### 6. Team Progress Heatmap (full width, bottom)
- Drop in the existing `<RosterHeatmap>` component (it already supports filters and learner click → drawer). Wire learners + modules from the same overlay/cohort data.
- Wrapped in a `Card` with a header strip ("Module progress · Investment Management Readiness · Jan 2026") and a "Open cohort →" link.

## Visual language (the "million-dollar" feel)

- **One typeface system:** display font (existing `font-display`) only for hero title and pulse-strip numbers. Everything else: default UI sans. No mid-weight bolds randomly sprinkled.
- **Spacing rhythm:** consistent 24px / 16px / 12px / 8px scale. Page padding `p-8` on `lg`, `p-6` on `md`, `p-4` on mobile. Section vertical gap `space-y-8` (lg) / `space-y-6`.
- **Card treatment:** subtle `border border-border bg-card`, `rounded-xl`, `shadow-sm`; never stacked with thick borders. Hover on roster rows: `hover:bg-muted/40` only — no transforms.
- **Status colours:** strictly semantic — `emerald` (rising/on_track), `sky` (in_progress), `amber` (needs_check_in/at_risk_soft), `rose` (at_risk/overdue). Always token-based, dark-mode safe.
- **Avatars:** initials in a circle, background colour = HSL derived from a hash of the name (stable). Foreground = `text-foreground` over light bg / `text-background` over dark.
- **No emoji glyphs in the new chrome** (heatmap can keep its own check/dot system internally).
- **Truncation everywhere:** `truncate` on every name/headline cell with `min-w-0` parent to guarantee no horizontal spillover.
- **Responsive:** below `lg` the right rail (Action Queue + Cohorts) drops under the roster as full-width sections in the same order. Pulse strip becomes 2×2.

## Files

- **Rewrite:** `src/pages/TeamMode.tsx` — composes the new sections.
- **New:** `src/components/team-home/TeamHero.tsx` — title + summary line + quick actions.
- **New:** `src/components/team-home/PulseStrip.tsx` — 4 KPI tiles.
- **New:** `src/components/team-home/TeamRoster.tsx` — sortable, filterable list of `LearnerOverlay`s with avatar + progress + drawer trigger.
- **New:** `src/components/team-home/RosterRow.tsx` — extracted single-row card.
- **New:** `src/components/team-home/ActionQueue.tsx` — redesigned recommended-actions list.
- **New:** `src/components/team-home/MyCohortsCard.tsx` — cohort cards.
- **New:** `src/components/team-home/Avatar.tsx` — initials avatar with hashed colour (or use existing `Avatar` from shadcn if present — check first and reuse).
- **Reuse as-is:** `LearnerStatusBadge`, `LearnerDrawer`, `RosterHeatmap`, `useAccountCohorts`, `getAllDemoOverlays`, `COHORT_MODULES_FALLBACK`, `useAccount`/`useUser` for name lookup.
- No DB schema changes. No new routes. No data shape changes.

## QA plan after build

1. Render at `lg` (1280) — verify two-column layout sits inside viewport, no horizontal scroll, no roster row overflow.
2. Render at `md` (768) — right rail collapses, roster rows stack neatly.
3. Render at `sm` (375) — pulse strip becomes 2×2, hero buttons wrap under title, roster rows stay tappable.
4. Open every drawer trigger to confirm `LearnerDrawer` still works end-to-end.
5. Confirm names (not IDs) appear in roster, action queue, talent rows.
