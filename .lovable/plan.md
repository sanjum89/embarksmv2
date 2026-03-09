

## Plan: Add Light Mode option to New UI theme picker

Currently the New UI only shows "Super Light" and "Dark Mode" toggles. The original light mode (dark navy sidebar) should also be available.

### Changes

**File:** `src/components/layout/AppSidebar.tsx` (lines 522-533)

Replace the single "Super Light" toggle with three distinct mode buttons for New UI:
- **Light** — the original dark navy sidebar (superLight off, theme light)
- **Super Light** — white sidebar (superLight on, theme light)  
- **Dark** — dark mode

This means replacing the current Super Light toggle + Dark Mode button (when in New UI) with three explicit options showing which is active.

**Implementation:**
- When "Light" is clicked: `setSuperLight(false)`, ensure theme is `light`
- When "Super Light" is clicked: `setSuperLight(true)`, ensure theme is `light`
- When "Dark" is clicked: set theme to `dark`
- Show checkmark on the active option
- Keep the existing Dark/Light toggle for Traditional UI unchanged

