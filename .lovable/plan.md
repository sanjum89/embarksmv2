## Goal

Replace the current first-login tour popover card with a smaller, more inviting animated pill that floats next to the sidebar's sparkle (tour) icon — matching the uploaded reference. The pill says "Take a tour", animates in to draw attention, and has a close (X) button.

## Behavior

- Shows only for eligible personas (Clara / Theo) on first login (same `useShowTourEntryPoints` + `embark_tour_seen::{uid}` localStorage flag already used).
- Anchored to the right of the sparkle button in the collapsed sidebar bottom controls.
- Animations:
  - Slide-in + fade from the left after a short delay (~600ms after mount), so it feels like it "pops out" of the icon.
  - Gentle continuous wiggle/bounce (subtle, every few seconds) to draw the eye until dismissed.
  - Soft glow / ring pulse around the pill.
- Clicking the pill body → starts the tour (`tour.start(0)`) and dismisses.
- Clicking the X → dismisses without starting (persists `seen=1`).
- Auto-hides when the tour opens, or once dismissed (never returns).
- Keeps the existing small pulsing dot on the sparkle icon as a secondary cue (optional — keep for now).

## Visual

```
 [✦]  ╭──────────────────╮
       │ Take a tour  ✕ │   ← rounded-full, bg-card, border, shadow-lg
       ╰──────────────────╯
```

- `rounded-full` pill, `bg-card`, `border-border`, `shadow-2xl`.
- Left side: small sparkle icon in primary tint, then "Take a tour" label (text-sm, font-medium).
- Right side: ghost X button.
- Position: `absolute left-full ml-3 top-1/2 -translate-y-1/2` relative to the sparkle button's wrapper, `z-[9000]`, `whitespace-nowrap`.

## Technical changes

- Edit `src/components/tour/TourSidebarHint.tsx`:
  - Drop the `Popover` / `PopoverAnchor` / `PopoverContent` UI.
  - Render `children` as-is, then absolutely position the new pill next to it inside the existing `div.relative` wrapper.
  - Reuse the existing `show`, `seen`, `dismiss`, and `tour.start` logic unchanged.
  - Add Tailwind animation classes; if a custom keyframe (subtle wiggle) is needed, add it to `tailwind.config.ts` under `keyframes` + `animation` (e.g. `tour-nudge`). Use `animate-in slide-in-from-left-2 fade-in` for entry.
- No changes to `TourContext`, `EmbarkTour`, `AppSidebar`, or the welcome banner.

## Out of scope

- Tour content/steps themselves.
- Behavior on other personas or when sidebar is expanded (pill still anchors next to the button — works in both states since it's `left-full`).
