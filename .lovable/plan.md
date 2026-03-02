

## Plan: Single-Line Skills & Resize Gap Pills

### 1. Core Skills — single line with dynamic overflow
- Use `flex-nowrap overflow-hidden` on the container with a fixed height (single row)
- Use a `useRef` + `useEffect` + `ResizeObserver` to measure which pills fit in one line
- Dynamically compute `visibleCount` and show `+N more` for the rest
- Same approach for Other Skills row

### 2. Other Skills — single line with dynamic overflow
- Same overflow logic: measure container, show only pills that fit, dynamic `+N more`

### 3. Skills & Gap pill sizing to match screenshot
From the reference image, the pills are noticeably larger:
- **Title**: `text-base font-bold` (currently `text-sm font-semibold`)
- **Filter selects/buttons**: slightly larger padding, `text-sm` (currently `text-xs`)
- **Skill pills**: `py-2 pl-5 pr-1.5 text-sm` with larger level badges `h-8 w-8 text-sm` (currently `h-7 w-7 text-xs`)
- **Target badges**: `h-8 w-8 text-sm font-bold`
- **">>" separator**: `text-sm` (currently `text-xs`)
- **Row spacing**: `space-y-4` (currently `space-y-3`)

### Files to edit
- `src/pages/My360.tsx` — all changes in this single file

