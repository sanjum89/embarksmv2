## Two fixes: LearnerChat layout + consistent page animations

### 1. LearnerChat home (`/chat`) — match image 1 layout

Currently `LearnerChat.tsx` stretches edge-to-edge inside the main column, with wide-short suggestion tiles and a tall Agent One nudge.

Changes in `src/pages/LearnerChat.tsx` (home state only — chat state untouched):
- **Vertical centering**: outer scroll container becomes `flex items-center justify-center` so the block sits in the middle of the viewport (with `py-8` top/bottom safety so it scrolls on short screens).
- **Narrower frame**: shrink `max-w-[960px]` → `max-w-[720px]` to stop edge-to-edge stretch. Reduce inner padding to `px-4`.
- **Greeting**: keep heading size, tighten bottom margin to `mb-4`.
- **Agent One nudge**: ensure it sits as a single compact card; cap height with `max-h-[88px]` overflow-hidden when collapsed (no internal layout change to the component itself).
- **Suggestion tiles**: keep 3-col on desktop (`sm:grid-cols-2 lg:grid-cols-3`) but make them squarer — illustration block becomes `h-24`, tile uses `p-4`. Result: taller, more uniform cards matching the screenshot proportions.
- **Composer**: same compact `Ask anything…` row, full width of the 720px frame.

Out of scope: the chat-active state (DeepResearchWorkspace) — that already works.

### 2. Consistent animations across pages

Earlier work added `motion` only in a handful of pages. To make it pervasive without rewriting every page, add a shared route-transition wrapper.

- **New** `src/components/layout/PageTransition.tsx`: a thin `motion.div` with `initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} transition={{duration:0.25, ease:"easeOut"}}` and a `key` driven by `useLocation().pathname`.
- **Edit** `src/components/layout/AppLayout.tsx` (or wherever `<Outlet />` lives): wrap `<Outlet />` inside `<AnimatePresence mode="wait"><PageTransition>…</PageTransition></AnimatePresence>`. Every route gets a fade/slide-up on entry, automatically.
- **Card entrance helper** `src/components/layout/StaggerList.tsx`: tiny utility exporting `staggerParent` / `staggerChild` variants so any page can wrap a grid in `<motion.div variants={staggerParent} initial="hidden" animate="show">` + `<motion.div variants={staggerChild}>` per item. Then apply it to the highest-traffic surfaces that currently render flat: `CohortHub` (track row, achievements grid, module list), `NewMy360` tabs (already partially animated — normalize), `ActionCentre` (time-bucket rows), and `LearnerChat` tiles.

This avoids touching dozens of files individually while still giving every page a baseline transition.

### Out of scope
- Logic, data, hooks, routing.
- Embark split-pane (root `/`) layout — keep as-is unless you say otherwise.

### Files touched
- `src/pages/LearnerChat.tsx` (layout only)
- `src/components/layout/PageTransition.tsx` (new)
- `src/components/layout/StaggerList.tsx` (new)
- `src/components/layout/AppLayout.tsx` (wrap Outlet)
- `src/pages/CohortHub.tsx`, `src/pages/ActionCentre.tsx`, `src/pages/NewMy360.tsx` (apply stagger helper to one main grid each)
