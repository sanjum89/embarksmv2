
Goal: move only the sidebar brand divider so it aligns with the already-matching Embark AI and content header borders.

1. Fix the sidebar header box
- In `src/components/layout/AppSidebar.tsx` (brand section around line 588), replace the current padding-based wrapper with a true fixed-height header row.
- Change the wrapper from `min-h-[60px]` plus `py-3` / `flex-col` to a single centered row such as `h-[60px] flex items-center border-b ...`.
- Keep horizontal spacing only (`px-4` when expanded, centered layout when collapsed). Remove vertical padding from the wrapper so the border sits at the exact intended height.

2. Leave Embark/content headers as-is
- Keep `src/components/learnpath/LearnPathChat.tsx` and `src/components/learnpath/LearnPathModeSelector.tsx` on the current 60px header height.
- Since those two now coincide, the remaining drift should be solved by adjusting the sidebar only, not by moving the other two again.

3. Preserve centering of the sidebar control
- Ensure `AccountSwitcher` remains vertically centered inside the new 60px sidebar header in both expanded and collapsed states.
- If needed, use wrapper-level centering (`items-center`, `justify-center` for collapsed) instead of wrapper padding.

## Technical detail
The sidebar brand wrapper is the unstable piece because it still mixes a height constraint with vertical padding and a column layout. The robust fix is to make it a single fixed-height flex row, so its `border-b` lands on the same Y-position as the Embark AI and content panel borders.
