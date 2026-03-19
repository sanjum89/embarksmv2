

# Single-Button Mode Toggle for Both UIs

## Problem
- **New UI**: Shows all three mode options (Super Light / Light / Dark) as a segmented control. Should be a single button that cycles on click.
- **Traditional UI**: Button always says "Dark mode" regardless of current state. Should show the current mode name with the correct icon, and toggle on click.

## Changes

### `src/components/layout/AppSidebar.tsx`

**Traditional UI (lines 336-356)** — Fix the label to reflect current state:
- When `theme === "light"`: show Sun icon + "Light mode", click switches to dark
- When `theme === "dark"`: show Moon icon + "Dark mode", click switches to light
- Same fix for collapsed tooltip text

**New UI (lines 613-673)** — Replace the 3-button segmented control with a single button (same pattern as Traditional):
- When expanded: show icon + current mode label ("Super Light" / "Light mode" / "Dark mode"), click cycles to next
- When collapsed: keep existing cycling icon button (already correct), just fix tooltip
- Cycling order: Super Light → Light → Dark → Super Light (already implemented for collapsed)

### Files Modified
- `src/components/layout/AppSidebar.tsx`

