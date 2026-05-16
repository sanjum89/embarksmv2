## Goal

Make the three "How content adapts" tour steps (Condensed / Quick Diagnostic / Evidence Task) follow each persona's actual journey for Clara (`rb-l6`, mid__in_im) and Theo (`rb-l3`, early__in_im), instead of a fixed Condensed → Diagnostic → Evidence order that misses targets and falls back to a static card.

## What's wrong today

`tourSteps.ts` hardcodes three lens steps targeting the *first* `[data-tour="lens-*"]` in the document. With all modules expanded, the first lens pill in the DOM rarely matches the step the popover is describing — and for Clara the order doesn't match her journey at all:

- Clara's first module `bk1.intro_wealth_rathbones` = **Quick Diagnostic** (not Condensed).
- Clara's first Condensed module = `bk2.kyc_suitability`.
- Clara's first Evidence module = `cps2.cisi_iad_bridge`.

So step "Condensed" runs first, finds no `lens-condensed` near the top of Clara's view, and shows the centered fallback card. Theo has a different ordering again.

## Fix

Generate the three lens steps **dynamically per user** from the actual rendered journey (which is already persona-driven via `persona_module_adaptations`). Each generated step:

- Targets a specific module's lens pill, not "the first lens pill on the page".
- Appears in **journey order** (not a fixed lens order).
- Names the module in the step title and body so it feels tailored ("Quick Diagnostic — *Introduction to Wealth at Rathbones*").
- Scrolls only that module into view.

Limit the dynamic tour to Clara and Theo, matching today's `useShowTourEntryPoints` gating.

### Detailed steps

1. **Expose module identity in the DOM** (`src/components/learnpath/JourneyModuleAccordion.tsx`)
   - Add `data-module-code={m.code}` and `data-module-title={m.title}` to each `<AccordionItem>` so the tour can locate lens pills by module and read their titles.

2. **Per-step accordion expansion** (same file)
   - Replace the existing `embark:tour-expand-all-modules` handler with one that also accepts an opt-in detail payload `{ moduleCode?: string }`. When a single module code is passed, ensure that one module is open (in addition to whatever else is open); when no code is passed, fall back to expanding all (kept for the intro `adapt-intro` step).

3. **Dynamic lens-step builder** (new `src/components/tour/buildLensSteps.ts`)
   - Function `buildLensSteps(): TourStep[]` that:
     - Dispatches `embark:tour-expand-all-modules` and waits ~400ms.
     - Queries every `[data-module-code]` in document order.
     - For each module, checks for `[data-tour="lens-condensed" | "lens-diagnostic" | "lens-evidence"]` inside it.
     - Walks modules in order; the first time each lens type appears, emits one step with:
       - `target: '[data-module-code="..."] [data-tour="lens-..."]'`
       - `title` and `body` referencing the module title and the lens explanation.
       - `prepare` that dispatches `embark:tour-expand-all-modules` with the matching `moduleCode` and scrolls the pill into view.
     - Returns the steps ordered by the journey (so Clara gets Diagnostic → Condensed → Evidence; Theo gets Condensed → Diagnostic → Evidence — derived, not hardcoded).
   - If a lens type genuinely doesn't appear for the user, that step is omitted (no more orphan fallback cards).

4. **Resolve the tour step list at start time** (`src/contexts/TourContext.tsx`, `src/components/tour/EmbarkTour.tsx`)
   - `TourContext` keeps a `steps: TourStep[]` in state instead of importing `TOUR_STEPS` directly. `start()` accepts an optional `steps` override.
   - In `EmbarkTour`, when the tour reaches the `adapt-intro` step (which still expands all modules), call `buildLensSteps()` once and splice the resulting steps in place of the current `adapt-condensed | adapt-diagnostic | adapt-evidence`. From then on the popover walks the new ordered list.
   - The intro and "why each lens" wrap-up steps remain static.

5. **Tour launch path** (`src/components/tour/TourLaunchButton.tsx`, `TourWelcomeBanner.tsx`)
   - No API change; they still call `tour.start()`. The dynamic splice happens inside `EmbarkTour`.

6. **Keep existing safety nets**
   - The fallback hint banner stays in place for legitimately missing targets but should rarely trigger now.
   - Pulse + spotlight + caret unchanged.

### Out of scope

- Tour copy beyond the lens-step titles/bodies (which gain the module title).
- Steps for non-`/` pages (Cohort, Action Centre, My 360, Role Play) — already targeted correctly.
- Anything outside Clara/Theo (other personas don't see the tour today).
- Adaptation engine, DB schema, persona logic.

### Files

- `src/components/tour/buildLensSteps.ts` *(new)*
- `src/components/tour/tourSteps.ts` *(remove the three static lens steps; keep the intro and wrap step IDs so the splice point is well-defined)*
- `src/contexts/TourContext.tsx` *(steps live in state; allow override)*
- `src/components/tour/EmbarkTour.tsx` *(splice dynamic steps when entering `adapt-intro`)*
- `src/components/learnpath/JourneyModuleAccordion.tsx` *(expose `data-module-code` / title; extend expand handler)*
