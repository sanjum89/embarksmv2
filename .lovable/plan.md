

## Align Embark AI Header Border with Sidebar

### Problem
The sidebar brand section renders taller than the Embark AI chat header and content panel header despite all using similar padding. The sidebar has `py-4` (32px) wrapping a button with `py-1.5` + `h-8` logo, totaling ~70px. The Embark AI header with `py-[18px]` only reaches ~56px.

### Fix
Use a fixed `min-h` on all three headers instead of relying on padding to match heights:

**`src/components/layout/AppSidebar.tsx`** (line 588)
- Add a data attribute or note the exact rendered height. The brand section div uses `px-4 py-4`.

**`src/components/learnpath/LearnPathChat.tsx`** (line 475)
- Change from `py-[18px]` to `min-h-[65px] flex items-center` so it matches the sidebar brand section height regardless of content

**`src/components/learnpath/LearnPathModeSelector.tsx`** (line 24)
- Same change on the top bar: `min-h-[65px] flex items-center` to ensure the first border aligns with sidebar and chat header

This approach is more robust than guessing padding — all three sections share the same minimum height so their `border-b` lines align perfectly.

