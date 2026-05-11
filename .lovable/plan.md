# Fix wrapping status badges in Team roster

## Problem

In the Team Home roster rows, the status badges ("Rising star", "On track", "Check in", "At risk") are wrapping onto two lines and rendering as tall pill blobs (see screenshots). Cause: the shadcn `Badge` base class doesn't include `whitespace-nowrap`, and the badge sits in a `flex-1 min-w-0` column next to a truncating `lastActivity` span, so it gets squeezed and wraps.

A secondary symptom: at narrow widths the badge column collapses and there's not enough room for the badge + activity text on one line.

## Fix (minimal, presentation-only)

### 1. `src/components/manager-hub/LearnerStatusBadge.tsx`
- Add `whitespace-nowrap` to the badge classes so labels never wrap. Single change to both branches (the "No data" fallback and the active badge).

### 2. `src/components/team-home/RosterRow.tsx`
- Mark the `LearnerStatusBadge` container as `shrink-0` so it never gets squeezed below its intrinsic width.
- Make the secondary `lastActivity` span the only thing that truncates in the row: keep `truncate` + `min-w-0` on the surrounding wrapper.
- Tighten the layout for the middle column:
  - `flex items-center gap-2 min-w-0` for the top row (badge first, activity second).
  - The badge stays at intrinsic width; activity text gets `min-w-0 flex-1 truncate`.

Result: badges always render on a single line as proper pills; long activity strings ellipsize instead of pushing the badge to wrap.

### 3. Quick QA
- Render Team Home at desktop (1280) and the screenshotted narrower width — verify all four status labels render on one line.
- Verify roster row never overflows or pushes the chevron off-card.

## Files touched
- `src/components/manager-hub/LearnerStatusBadge.tsx`
- `src/components/team-home/RosterRow.tsx`

No data, route, or business-logic changes.
