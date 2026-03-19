

# Separate Theme Popover (UI Only) from Mode Toggle on Sidebar

## Current State
- **Traditional sidebar**: Has a standalone dark/light toggle button + a Theme popover containing UI style switch AND a dark/light toggle
- **New UI sidebar**: Has only a Theme popover containing UI style switch + Super Light / Light / Dark options

## Changes

### `src/components/layout/AppSidebar.tsx`

**Traditional sidebar (lines 358-391)** — Strip mode switching from the Theme popover. Keep only the "New UI" / "Traditional UI" buttons. The existing standalone dark/light toggle button (lines 336-356) already handles mode switching, so no additions needed there.

**New UI sidebar (lines 609-683)** — Two changes:

1. **Add standalone mode toggle buttons** above the Theme popover (before line 609):
   - Three buttons when expanded: "Super Light", "Light", "Dark" — rendered as a small segmented control or individual buttons (matching the sidebar style)
   - When collapsed: a single Sun/Moon icon button that cycles through the three modes, with tooltip

2. **Strip mode options from the Theme popover** (lines 644-680): Remove the `<Separator>` and all Super Light / Light / Dark buttons. The popover keeps only the "UI Style" section (New UI / Traditional UI).

### Result
- Theme popover on both sidebars: only shows "New UI" vs "Traditional UI"
- Traditional sidebar: standalone Light/Dark toggle (already exists)
- New UI sidebar: standalone Super Light / Light / Dark toggle (new)

### Files Modified
- `src/components/layout/AppSidebar.tsx`

