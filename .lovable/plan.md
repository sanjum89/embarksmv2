Root cause: the Tour button is wrapped in `TourSidebarHint`, but that wrapper is only `inline-flex`. In the collapsed sidebar, the surrounding bottom controls expect every item to occupy the same fixed icon footprint (`h-9 w-9` in the traditional sidebar, `h-10 w-10` in the newer sidebar). The wrapper does not enforce that footprint, so the Tour row can measure differently from Accessibility/Settings, making Settings appear off-column.

Plan:
1. Update `TourSidebarHint` to accept an explicit `expanded` and `size`/`className` style input, or a simpler `variant`, so the wrapper can match the exact sidebar button dimensions.
2. In `AppSidebar.tsx`, pass the correct wrapper size in both sidebar branches:
   - Traditional collapsed: `h-9 w-9`
   - New collapsed: `h-10 w-10`
   - Expanded: `w-full h-9`
3. Keep the floating callout rendered through the portal so it never affects layout.
4. Keep the close button behavior exactly as requested: closing hides only until refresh; no persistent storage.
5. Verify visually that Theme, Accessibility, Tour, and Settings align in the same vertical column and the callout appears next to Tour without pushing anything.