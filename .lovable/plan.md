
## Problem

When the user is viewing a chapter inside Embark (`/`, `contentView === "module"`) and starts (or replays) the product tour, the "How content adapts" steps — Condensed, Quick Diagnostic, Microlearning, Evidence Task — never find their targets. The tour shows the "Scan the page for the highlighted element" fallback because:

- `JourneyModuleAccordion` is only mounted when `contentView === "modules"` (the All Modules grid).
- The chapter view is mounted instead, so the accordion's `embark:tour-expand-all-modules` listener doesn't exist and the lens pills (`[data-tour="lens-*"]`, `[data-tour="embark-modules"]`) aren't in the DOM.
- The tour's `prepare()` only dispatches the expand-accordion event; it never asks Embark to switch its in-page view back to All Modules.

The route check (`pathname === step.route`) passes because both views live at `/`, so the navigation guard in `EmbarkTour` doesn't help.

## Fix

Make the tour explicitly return Embark to the All Modules grid before the "How content adapts" steps spotlight anything.

### 1. `src/components/learnpath/LearnPathContent.tsx` (`EmbarkContent`)
Add a `useEffect` that listens for a new window event `embark:tour-show-modules` and calls `showModuleGrid()` (already exposed by `useEmbark()`). This unmounts the chapter view and mounts `JourneyModuleAccordion`, which in turn registers the existing `embark:tour-expand-all-modules` listener.

### 2. `src/components/tour/tourSteps.ts`
Update `expandAllModules()` so it first dispatches `embark:tour-show-modules`, waits ~250 ms for the accordion to mount, then dispatches the existing `embark:tour-expand-all-modules` event, then waits another ~350 ms before resolving. This is the prepare used by `adapt-intro`, `adapt-condensed`, `adapt-diagnostic`, `adapt-microlearning`, `adapt-evidence`.

### 3. `src/components/tour/buildLensSteps.ts`
- In `fireExpandAll()` and `fireExpandOne()`, dispatch `embark:tour-show-modules` first.
- In `buildLensSteps()`, after `fireExpandAll()` wait long enough for the view switch (bump the existing `waitMs(380)` to ~600 ms) before querying `[data-module-code]`. Otherwise the persona-specific lens detection runs against an empty DOM.
- Each dynamically generated step's own `prepare` (which currently calls `fireExpandOne`) will get the same show-modules dispatch for free via step 1.

### Out of scope
- No changes to the step list itself, the spotlight/popover logic, or any non-tour Embark behaviour.
- No change to other routes (Cohort Hub, Action Centre, My 360, Role Play) — their navigation is already handled by the existing `route` field on each step.

### Verification
- Open `/`, open any chapter (so `contentView === "module"`).
- Click the tour entry point and advance to "Content adapts to you" — Embark should switch back to All Modules with all accordions expanded and the spotlight should land on the modules panel.
- Continue through the four lens steps and confirm each spotlight resolves (or shows its specific fallback hint when no pill exists for the active persona).
- Tour also still works correctly when starting from the All Modules view (no regression: extra show-modules dispatch is a no-op when already on `modules`).
