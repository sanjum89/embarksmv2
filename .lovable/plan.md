# Standardize subtle animations across the product

Match the Role Play Bank entrance (fade + 12px rise, 0.35s, staggered by 0.06s) on every page, list, grid, section, tab and modal — for learners, managers and admins.

## What ships

### 1. Motion primitives (shared, framer-motion based)
New file `src/components/motion/Motion.tsx` exporting:
- `<PageTransition>` — wraps page content. `initial {opacity:0, y:8}` → `animate {opacity:1, y:0}`, 0.3s easeOut.
- `<StaggerList>` + `<StaggerItem>` — for grids/lists. Item: `initial {opacity:0, y:12}` → `animate {opacity:1, y:0}`, delay = `index * 0.06`, duration 0.35s. Includes `AnimatePresence` so removed items fade.
- `<SectionReveal>` — for inner sections/tabs/modals. Same as PageTransition with optional `delay` prop.
- All primitives short-circuit to a plain `<div>` when `prefers-reduced-motion` is on **or** the user toggled "Reduce motion" off in Accessibility settings.

### 2. CSS utilities (lightweight, for static blocks)
Add to `src/index.css`:
- `.anim-page` → `animate-fade-in` (already exists, 0.3s).
- `.anim-stagger > *` → each child gets `animation-delay: calc(var(--i,0) * 60ms)`.
- Wrap all keyframes in `@media (prefers-reduced-motion: no-preference)` and an `html:not(.no-motion)` guard so the toggle disables them globally.

### 3. Accessibility setting: "Reduce motion"
- Add `reduceMotion: boolean` to `A11ySettings` in `src/contexts/AccessibilityContext.tsx`. Default `false` (animations on).
- Initial value: if `localStorage` has no preference, read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` as the default; otherwise honour the stored value.
- When `true`, add `no-motion` class to `<html>` (disables CSS keyframes) and expose via `useReducedMotion()` hook for the Motion primitives.
- Surface the toggle in `src/components/layout/AccessibilityPanel.tsx` as a new `Switch` row beneath the existing toggles, labelled **"Reduce motion"** with helper text "Turn off subtle page and list animations."

### 4. Apply standard pattern everywhere
**Layout-level (covers every route in one shot):**
- Wrap the `<Outlet />` in `src/components/layout/AppLayout.tsx` with `<PageTransition>` keyed by `location.pathname` so each route navigation re-plays the fade-in. This alone covers ~90% of pages with zero per-page edits.

**Per-page list/grid retrofits (where stagger helps):**
Replace ad-hoc fade/motion with `<StaggerList>` + `<StaggerItem>` on these card/grid surfaces (keep current data + classNames, only swap the wrapper):
- `src/pages/Dashboard.tsx` (recommended targets row, KPI tiles)
- `src/pages/CohortHub.tsx` (KPI tiles, co-learning timeline, people list, recommended actions)
- `src/pages/RolePlayBank.tsx` (already stagger — just migrate to the shared component for consistency)
- `src/pages/ManagerRolePlay.tsx`, `src/pages/ManagerSkillTargets.tsx`, `src/pages/ManagerSkillTargetDetail.tsx`, `src/pages/ManagerView.tsx`
- `src/pages/SkillTargetDetail.tsx`, `src/pages/SkillTargetBuilder.tsx`, `src/pages/AssessmentPage.tsx`
- `src/pages/My360.tsx`, `src/pages/NewMy360.tsx`, `src/pages/TeamInsights.tsx`, `src/pages/PeopleGraphIntelligence.tsx`, `src/pages/DeepResearch.tsx`, `src/pages/Settings.tsx`, `src/pages/DevTools.tsx`, `src/pages/AIManager.tsx`, `src/pages/ProgramContextPage.tsx`
- `src/components/admin/*` panels and `src/components/manager/*` panels (NewHires, Progress, ProgramContext, TrainingAssign, PeopleGraph, EmployeeDetail)

**Modals / tabs / popovers:** leave shadcn Dialog / Tabs / Popover defaults intact — they already animate consistently via Radix. No changes.

### 5. Cleanup
Remove now-redundant inline `motion.div initial/animate` blocks on the pages above so all animation timing lives in one place. Hand-rolled `animate-pulse` / `animate-spin` loading states stay untouched.

## Out of scope
- No new framer-motion install (already a dep).
- No backend, schema, or analytics changes.
- No changes to chat-stream typewriter or loading spinners.
- No changes to the existing First-Login guided tour overlay.

## Technical notes
- Centralised timing constants in `Motion.tsx`: `DURATION = 0.35`, `STAGGER = 0.06`, `RISE = 12`, `EASE = [0.22, 1, 0.36, 1]`.
- `<PageTransition>` uses `mode="wait"` inside `AnimatePresence` so outgoing route fades before incoming rises (~150ms overlap).
- Reduced-motion gate is a single `useReducedMotion()` hook reading `AccessibilityContext.reduceMotion || mediaQuery.matches`.
- ASCII map of the dependency graph:
```text
AccessibilityContext ──► useReducedMotion ──► <PageTransition>
                                          └─► <StaggerList/Item>
AppLayout (Outlet) ──► <PageTransition keyed by pathname>
Pages/grids       ──► <StaggerList>{items.map(<StaggerItem>)}
index.css (.no-motion guard) disables CSS keyframes globally
```
