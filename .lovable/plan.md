

## Fix Skill Gap Pills: Fixed Width, 2-Column Grid with Pagination

### Problem
Skill pills in the Skills & Gap section overflow on Maya's profile (8 project skills). Pills have variable widths causing misalignment.

### Solution
Replace the current vertical list with a **2-column, paginated grid** inside the Skills & Gap card:

- **Fixed-width pills**: Each skill pill uses `w-full` within its grid cell so all items align uniformly
- **2-column layout**: `grid grid-cols-2 gap-2`
- **Max 4 skills per column** = 8 per page (4 rows × 2 cols)
- **Pagination**: If more than 8 skills, show a right arrow button at the bottom-right to go to the next page. Left arrow to go back. Show page indicator (e.g., "1/2")
- **State**: `gapPage` state variable, reset to 0 when `gapSource` or `gapFilter` changes

### File Changed
`src/pages/My360.tsx`

### Changes
1. Add `gapPage` state, reset on source/filter change
2. Compute `totalPages = Math.ceil(filteredGapRows.length / 8)` and `pageRows = filteredGapRows.slice(gapPage * 8, (gapPage + 1) * 8)`
3. Replace the `space-y-2 overflow-x-auto` div (lines 455-494) with:
   - A `grid grid-cols-2 gap-2` container rendering `pageRows`
   - Each pill: full-width within cell, skill name truncated, fixed layout
   - Below grid: pagination row with left/right `ChevronLeft`/`ChevronRight` arrows and "1/2" text, only shown when `totalPages > 1`
4. Keep existing pill styling (gap badges, level circles, gap labels) but ensure `w-full` and consistent truncation

