

## Plan: Theme Selector — "New" vs "Traditional"

### What it does
Adds a theme selector (Popover with two options) to the sidebar. Each theme has its own light and dark mode. "New" is the current navy/amber design. "Traditional" applies a Cornerstone-inspired look: white sidebar, orange brand accent, circular nav icons, and a softer corporate color palette.

### Changes

**1. `src/contexts/ThemeContext.tsx`** — Add `styleTheme` state
- New type: `StyleTheme = "new" | "traditional"`
- New state `styleTheme` persisted to `localStorage`
- Expose `styleTheme` and `setStyleTheme` via context
- In the `useEffect`, toggle `.traditional` class on `documentElement` alongside the existing `.dark` class

**2. `src/index.css`** — Add `.traditional` CSS variable overrides
- `.traditional` (light mode): white sidebar background, dark gray text, orange accent (`15 85% 55%`), light gray borders, white cards, muted lavender/gray secondary tones
- `.traditional.dark` (dark mode): dark gray sidebar, lighter text, same orange accent, darker card/surface colors
- Key difference from "New": sidebar goes from dark navy → white/light, accent goes from amber → Cornerstone orange-red

**3. `src/components/layout/AppSidebar.tsx`** — Replace Moon/Sun toggle with theme selector
- Replace the current dark/light toggle button with a Popover (Palette icon) showing:
  - "New Theme" option (with check if active)
  - "Traditional" option (with check if active)
  - Divider
  - Dark/Light mode toggle row (Sun/Moon) — preserved from current behavior
- When Traditional is selected: show the Cornerstone logo image (`src/assets/cornerstone-logo.png`) in place of the Building2 icon, and "cornerstone" text instead of "ABC Company"
- Nav items in Traditional mode get rounded-full icon containers instead of rounded-lg

### Files to change
- `src/contexts/ThemeContext.tsx`
- `src/index.css`
- `src/components/layout/AppSidebar.tsx`

