## Finish the standardised entrance animations rollout

The motion infrastructure already shipped:
- `src/components/motion/Motion.tsx` — exports `PageTransition`, `StaggerList`, `StaggerItem`, `SectionReveal`, `useReducedMotion`, shared `MOTION` timing constants.
- `AppLayout.tsx` wraps `<Outlet />` in `<PageTransition keyed by pathname>`, so every route already has a baseline fade+rise.
- `AccessibilityContext` exposes `reduceMotion` and toggles a `no-motion` class on `<html>`; Motion primitives respect it.

What's missing: the **per-page list/grid stagger retrofits**. Only `RolePlayBank.tsx` uses `StaggerList`/`StaggerItem` today, so pages like Cohort Hub, Dashboard, My 360, Manager screens still feel flat after the initial page fade.

### Pages to retrofit (one main grid each)

For each page, wrap the most prominent repeating grid in `<StaggerList>` and convert each child into a `<StaggerItem index={i}>`. No layout, data, or styling changes — just the wrapper.

1. `src/pages/CohortHub.tsx` — module progress list + co-learning timeline + achievements grid.
2. `src/pages/Dashboard.tsx` — main KPI / shortcut cards row.
3. `src/pages/NewMy360.tsx` — radar/skills grid inside Overview and Skills tabs.
4. `src/pages/ActionCentre.tsx` — `TimeBucketGroup` rows (each bucket fades in, items stagger inside).
5. `src/pages/ManagerView.tsx` + `src/pages/TeamDashboard.tsx` + `src/pages/TeamInsights.tsx` — primary card grids.
6. `src/pages/ManagerSkillTargets.tsx` + `src/pages/SkillTargetDetail.tsx` + `src/pages/SkillTargetBuilder.tsx` — top card lists.
7. `src/pages/PeopleGraphIntelligence.tsx` — node/insight column.
8. `src/pages/DeepResearch.tsx` — starter chips + result blocks.
9. `src/pages/Settings.tsx`, `src/pages/DevTools.tsx`, `src/pages/AdminView.tsx`, `src/pages/ProgramContextPage.tsx` — main section list.
10. `src/pages/AssessmentPage.tsx` — question card transition between steps via `SectionReveal`.
11. `src/pages/LearnerChat.tsx` — already uses inline motion for the 6 tiles; swap to `StaggerList`/`StaggerItem` for consistency.

### Cleanup
- Remove ad-hoc `motion.div initial/animate` blocks that duplicate `StaggerItem` behaviour (LearnerChat tiles, any My 360 inline fades, Role Play already done).
- Keep loading skeletons, modals, popovers, tour overlays untouched.

### Constants (already in `MOTION`)
`DURATION 0.35` · `PAGE_DURATION 0.3` · `STAGGER 0.06` · `RISE 12` · `PAGE_RISE 8` · ease `[0.22, 1, 0.36, 1]`.

### Out of scope
- New animations on modals, tooltips, sheets — shadcn defaults stay.
- Chat stream typewriter / Embark AI assistant typing.
- Tour overlay, login screen.
- Any data, routing, or visual changes beyond mount transitions.

### Result
Every route gets a baseline page fade *and* its main grid staggers in, consistent across learner, manager, and admin views. Users with reduce-motion on (OS or in-app accessibility toggle) see no animation.
