## Plan

1. **Remove the layout side-effect from `TourSidebarHint`**
   - Change the wrapper from `inline-flex` to a block-level wrapper that does not add its own centering/inline layout behavior.
   - Keep the notification dot and popout positioning anchored to the tour button.

2. **Normalize the collapsed bottom button row**
   - In `AppSidebar.tsx`, wrap each collapsed bottom item in the same fixed-size container:
     - theme toggle
     - accessibility trigger
     - tour trigger
     - settings link
   - This makes Settings align from its outer box, not from mixed Tooltip/Portal/Tour wrappers.

3. **Keep existing visual behavior unchanged**
   - Do not change labels, icons, routes, hover states, or expanded-sidebar layout.
   - Only adjust collapsed-sidebar sizing/alignment so Settings sits in the same vertical column as the other icons.

4. **Verify visually**
   - Re-open the preview in collapsed mode and confirm the four bottom icons share the same center x-position.