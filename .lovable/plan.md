## Problem

In the collapsed sidebar (the variant rendered around lines 700–778 of `src/components/layout/AppSidebar.tsx`), the three footer buttons — theme toggle (Sun), Accessibility (T) and Settings (gear) — each sit inside their own `<div className="w-full flex justify-center py-0.5">` wrapper. They use slightly different markup (plain `<button>` for theme, `<button>` inside `AccessibilityPanel` for T, `<NavLink>` inside `Tooltip` for gear). The result is that the gear sits a few pixels left of the Sun/T icons and the vertical rhythm differs from the upper nav and from the other sidebar variant (lines 340–413). The user flagged this as "Settings is misaligned".

## Fix

Refactor only the footer block (`Dark mode toggle` + `Accessibility` + `Settings`) in the second sidebar branch so all three controls share one container with consistent geometry, matching the upper nav pattern.

### Edits — `src/components/layout/AppSidebar.tsx` (lines ~700–778)

Replace the three per-item `<div className="w-full flex justify-center py-0.5">` wrappers with a single wrapper:

```text
<div className={cn(
  "w-full pb-1",
  expanded ? "px-3 space-y-1" : "flex flex-col items-center gap-1 px-0"
)}>
  {/* theme button */}
  {/* AccessibilityPanel trigger */}
  {/* Settings NavLink (wrapped in Tooltip when collapsed) */}
</div>
```

Inside this wrapper:

- Keep the expanded variants of each control as-is (full-width `h-9 px-3 rounded-lg` rows).
- For the collapsed variants, standardize every button to **exactly** the same classes:
  `flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors` (Settings adds the active `bg-sidebar-accent text-sidebar-accent-foreground` variant via `NavLink`'s render-prop, unchanged).
- Remove the `mb-1` margin on the expanded Sun button (replaced by `space-y-1` on the wrapper).

Also apply the analogous tidy-up to the first sidebar branch (lines ~340–413) so the Sun / T / Gear there share the same `h-9 w-9 rounded-full` classes verbatim (they already do; just collapse the wrapping `<div className="w-full pb-3 ... gap-1">` to remove the empty line / extra spacing between Accessibility and Settings so the three icons sit on a single tight axis).

No business-logic, no routing, no token changes — purely presentational alignment.

## Verification

After the edit, screenshot the collapsed sidebar in Manager view and confirm the three footer icons share the same horizontal centerline and equal vertical gaps. Re-check in expanded mode to confirm the labelled rows still align with the nav rows above.
