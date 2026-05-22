## Plan

1. **Fix the actual cause of the Settings drift**
   - The Settings item is the only collapsed bottom action rendered as a `NavLink` with a function-based `className` inside `TooltipTrigger asChild`.
   - That wrapper combination can prevent the anchor from receiving the same fixed `h-9/w-9` or `h-10/w-10` flex box as the other icon buttons, so the gear is drawn from a different left edge.

2. **Make Settings use the same pattern as the other sidebar links**
   - Compute `settingsActive` with the existing `isPathActive("/settings")` helper.
   - Pass Settings a plain string `className` instead of a callback while it is inside the tooltip trigger.
   - Apply this in both sidebar variants: traditional and new.

3. **Lock all collapsed bottom actions to one axis**
   - Keep each bottom row as a full-width centering shell.
   - Keep each clickable control as a fixed-size flex box.
   - No label, route, icon, hover, or expanded-sidebar behavior changes.

4. **Verify visually**
   - Reload the collapsed sidebar and confirm Sun, Type, Sparkles, and Settings share the same center line.