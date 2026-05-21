## Plan

1. **Restore icon alignment in the collapsed sidebar**
   - Keep the bottom action column centered.
   - Ensure the settings icon uses the same fixed collapsed button dimensions and wrapper behavior as the other bottom icons.
   - Avoid letting the tour hint wrapper affect the width/position of the adjacent settings item.

2. **Make the tour prompt a real floating message**
   - Keep the normal tooltip behavior for all bottom icons.
   - Add a separate floating callout next to the **Take a tour** menu item, anchored beside that specific button.
   - Include clear copy such as “Start the guided tour” with a dismiss control and click-to-start behavior.

3. **Fix why the callout may not appear**
   - Adjust `TourSidebarHint` so the callout is positioned from a stable wrapper and is not hidden or mispositioned by sidebar layout.
   - Preserve the existing first-login/localStorage dismissal behavior for Clara/Theo demo personas.

4. **Validate visually**
   - Check the collapsed sidebar view so the four bottom icons line up vertically and the floating tour message appears beside the tour item rather than replacing/centering tooltips.

## Technical notes

- Primary files involved: `src/components/layout/AppSidebar.tsx` and `src/components/tour/TourSidebarHint.tsx`.
- No backend/database changes are needed.
- The fix will be frontend-only and scoped to the sidebar tour hint behavior.