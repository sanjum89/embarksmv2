

## Plan: Skipped Chapters Styling, Super Light Mode, Traditional Sidebar Borders, and "cornerstone" Branding

### 1. Skipped chapters shown as completed (green) with assessment tag
**File:** `src/components/skill-target/StepListItem.tsx`

- Change `skipped` status rendering to match `completed`: green checkmark icon with `bg-success/15 ring-success/30`
- Change card styling for `skipped` from `border-border bg-muted/30` to `border-success/20 bg-success/5`
- Remove the `line-through` from skipped step titles
- Add `skipped` to the `isClickable` condition so users can still navigate into skipped chapters
- Add a small tag: "Passed via assessment" with `bg-success/10 text-success` styling, placed in the badges area

### 2. Super Light Mode (New UI default)
**Files:** `src/contexts/ThemeContext.tsx`, `src/index.css`, `src/components/layout/AppSidebar.tsx`

- Add `superLight` boolean state to ThemeContext (default `true` for New UI, persisted in localStorage)
- Toggle `.super-light` CSS class on document root
- When switching to New UI, auto-enable super light mode
- Add CSS variables under `.super-light` class:
  - Sidebar background: white (`0 0% 100%`)
  - Sidebar foreground: dark gray (`220 10% 30%`)
  - Sidebar border: light gray (`220 16% 90%`)
  - Sidebar accent: very light gray (`220 16% 96%`)
  - Keep amber as primary accent color
- Add a "Super Light" toggle in the theme popover (New UI only)

### 3. Traditional UI sidebar — clearer borders
**File:** `src/components/layout/AppSidebar.tsx`

- Change `border-border/30` to `border-border` on the nav strip `aside`
- Add `shadow-sm` for subtle depth, matching the screenshot's clear container look

### 4. Rename "Cornerstone" → "cornerstone"
**Files:** `src/components/layout/AppSidebar.tsx`, `src/components/skill-target/TraditionalContentViewer.tsx`

- Replace all display text instances of `"Cornerstone"` with `"cornerstone"` (keeping `alt` attributes unchanged for accessibility)

