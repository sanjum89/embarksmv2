

## Plan: Fix Badge Visibility & Add "+N more" Popover

### 1. Fix Core Skills badge visibility (light mode)

The `bg-background` badges are nearly invisible against the light-tinted pill backgrounds (e.g. `bg-accent/10`). 

**Fix:** Use `bg-white/90 shadow-sm` — a subtle white with shadow gives contrast against any tinted pill background in light mode and works in dark mode too.

**File:** `src/pages/My360.tsx` lines 288-289 — change `bg-background` to `bg-white/90 shadow-sm`.

### 2. Make "+N more" clickable to show full skill list

**Approach:** Add an `onMoreClick` callback prop to `ResponsivePillRow`. In My360, wire it to open a Popover (using existing Radix popover) that lists all skills with their proficiency and year.

**File: `src/components/my360/ResponsivePillRow.tsx`**
- Add optional `onMoreClick` prop and `allItems` render prop
- Make the "+N more" span a `<button>` when `onMoreClick` is provided

**File: `src/pages/My360.tsx`**
- Add state for which popover is open (`coreSkillsOpen` / `otherSkillsOpen`)
- Use a Popover anchored to the "+N more" button
- Render full skill list inside with name, proficiency, and year in a clean table/list layout

Alternatively, simpler approach: wrap the "+N more" pill in a Popover directly inside `ResponsivePillRow` by accepting a `renderAllItems` prop that returns the popover content.

**Chosen approach:** Add `renderExpandedList?: () => ReactNode` prop to `ResponsivePillRow`. When provided and `hiddenCount > 0`, wrap the "+N more" pill in a Radix Popover that renders the expanded list content. This keeps the component reusable.

### Files to change
- `src/pages/My360.tsx` — badge color fix + pass `renderExpandedList` for both Core and Other skills
- `src/components/my360/ResponsivePillRow.tsx` — accept `renderExpandedList` prop, wrap "+N more" in Popover

