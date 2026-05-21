## Goal

Rebalance the "Recommended actions" and "Achievements" cards into a true 50/50 split, and make the achievement pills compact + single-line with hover-to-expand behavior (mirroring the KPI strip pattern).

## Changes

### 1. Equal-width layout (`src/pages/CohortHub.tsx`, ~line 293)
- Change grid from `lg:grid-cols-3` (1/2 split) to `lg:grid-cols-2` (50/50).
- Drop `lg:col-span-1` / `lg:col-span-2` on the two cards.
- Bump achievements `ACH_PAGE_SIZE` from 8 to 6 (3×2 grid) to fit the narrower card cleanly. Grid becomes `sm:grid-cols-3` instead of `sm:grid-cols-4`.

### 2. Shorten achievement labels (`src/hooks/useCohortHub.ts`)
Recalibrate every achievement `label` to 1–2 short words. Examples:
- "First quiz passed" → "First quiz"
- "First reflection logged" → "First reflection"
- "5-day streak" → "5-day streak" (keep)
- "Module 1 complete" → "Module 1"
- "Peer mentor" → "Peer mentor" (keep)
- "Mock client ace" → "Mock ace"
- "Cohort lead nomination" → "Cohort lead"
- "CISI Level 4 passed" → "CISI L4"
- "FCA notified" → "FCA notified" (keep)
- "30-day streak" → "30-day streak" (keep)
- "Programme graduate" → "Graduate"
- "Client handover" → "Handover"
- "Top 10" → "Top 10" (keep)

### 3. Compact single-line pills with hover-expand (`src/pages/CohortHub.tsx`, lines 374–409)
Replace the current 2-line pill body with a single-line flex pill:
- Pill container: `flex items-center gap-1.5 rounded-full border px-2.5 py-1 min-w-0 max-w-full transition-all duration-200 group/pill`
- Label: `truncate whitespace-nowrap text-[11px] font-semibold` so overflow shows ellipsis on a single line.
- Points suffix: kept inline, hidden on overflow when collapsed (`hidden group-hover/pill:inline` on small viewports; always inline when fits).
- Hover behavior — mirror the KPI strip flex trick: wrap each pill cell in a flex item with `flex-1 min-w-0 hover:flex-[2] transition-[flex] duration-200`, so on hover the hovered pill grows lengthwise and siblings shrink (their labels truncate further). Implementation: change the grid to a `flex flex-wrap` row of fixed-basis items per row (3 per row on `sm:`), where each item uses `basis-[calc((100%-0.375rem*2)/3)] grow hover:grow-[3]` and contains a `min-w-0` truncating pill.
- Tooltip via `title={a.label}` retained so the full label is still readable.
- Locked pill follows the same single-line + truncate pattern.

### 4. Keep existing pieces intact
- Decorative glows, header (Milestones earned / Achievements / pts badge), pagination footer, and "Next: …" line stay unchanged in structure.
- No data-shape changes beyond label string edits; no hook/business-logic changes.

## Out of scope
- KPI strip, mentor card, tracks carousel, right rail, tabs.
- Icons, tier colors, points values, pagination logic (just page size constant).

## Technical notes
- Hover-expand uses Tailwind `transition-[flex]` + `grow` / `hover:grow-[N]` on flex children with `min-w-0` + `truncate` on the inner label. This is the same pattern already in the KPI strip and avoids JS state.
- 6 items per page in a 3-col grid keeps rows full and the card visually balanced against Recommended actions.
