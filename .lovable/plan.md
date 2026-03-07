

## Fix Other Skills Overflow

### Problem
The Other Skills section overflows because of two bugs:
1. **Line 139**: `otherExtra = profileData.otherSkills.length - otherVisible + 24` — the `+ 24` is wrong, should just be `profileData.otherSkills.length - otherVisible`
2. **Line 302**: `style={{ overflow: 'visible' }}` defeats the flex-nowrap clipping, causing pills to spill outside the container

### Fix

**In `src/pages/My360.tsx`:**

1. **Line 139** — Remove the `+ 24`:
   ```typescript
   const otherExtra = profileData.otherSkills.length - otherVisible;
   ```

2. **Line 302** — Remove `style={{ overflow: 'visible' }}` and add `overflow-hidden` to clip pills that don't fit:
   ```html
   <div ref={otherRef} className="relative flex flex-nowrap gap-2 overflow-hidden">
   ```

The `useVisibleCount` hook + ResizeObserver will then correctly measure how many pills fit in one row and show the accurate "+N more" badge for the rest. Hover tooltips use `position: absolute` with `z-50` so they'll still appear above the container via the `group` parent's `relative` positioning — but we need to keep the container's overflow visible for tooltips. Alternative: move tooltips to a portal or use `overflow-x: hidden; overflow-y: visible` — simplest fix is to just remove the inline style and let the hook handle clipping by only rendering the visible count of pills (no CSS clipping needed since we slice the array).

**Revised approach** — keep `overflow: visible` but fix the count bug:
1. Fix line 139: remove `+ 24`
2. That's likely the primary issue — the `+ 24` makes `otherExtra` always positive, which means the "+N more" badge always shows and the visible count logic gets confused

Single line change in `src/pages/My360.tsx`.

