## Goal
Add a guided product tour for Clara (rb-l6) and Theo (rb-l3) that walks them through Embark, content adaptation, Cohort Hub, Action Centre, My 360, and Role Play. The tour is launchable from any page via a persistent "Take the tour" button, and is announced once on first login with a dismissible banner.

## What "tour" means here
A step-driven coach-mark overlay (separate from the existing `FirstLoginTour`, which is a full-screen onboarding wizard). Each step has:
- A route to be on (the tour navigates the user there)
- An optional target selector (`data-tour="…"`) on a real UI element — the overlay dims the page and spotlights that element with a popover
- Title, body copy, and optional next/back/skip

When a step has no target it renders as a centered modal card (used for intros and "how adaptation works" explainers).

## Tour outline (sections × steps)

```text
1. WELCOME (modal)
   "Tour of Embark — 5 minutes. Skip anytime."

2. EMBARK PAGE  (route: /)
   • Embark home & AI chat panel  → spotlight chat panel
   • Cohort → Track → Module → Chapter (terminology, drop "Learning")
       → spotlight cohort header on / and journey accordion
   • Open a module accordion to show chapter rows

3. CONTENT ADAPTATION  (still on /)
   • Condensed lens          → spotlight a CONDENSED pill on a chapter row
   • Quick Diagnostic        → spotlight QUICK DIAGNOSTIC row + explain reopen/skip
   • Evidence Task           → spotlight EVIDENCE TASK row + explain submission
   • Why it adapts           → modal: persona profile + 360 gaps drive lens choice

4. COHORT HUB  (route: /cohort)
   • Members, milestones, progress strip — spotlight each

5. ACTION CENTRE  (route: /action-centre — confirm with code)
   • Nudges, reflections, reminders — spotlight each card

6. MY 360  (route: /my-360)
   • Competency radar, skills-gap matrix, career timeline — spotlight each

7. ROLE PLAY  (route: /role-play)
   • Bank of role-plays, character persona, voice option — spotlight each

8. WRAP  (modal)
   "You can replay this any time from the help button."
```

Exact route names will be verified against `src/App.tsx` while implementing (e.g. `/action-centre` vs `/inbox`).

## Components & files

New:
- `src/contexts/TourContext.tsx` — provider with `start(sectionId?)`, `next`, `back`, `skip`, `open` state, current step index. Persists "seen" to `localStorage` under `embark_tour_seen::<userId>`.
- `src/components/tour/EmbarkTour.tsx` — the overlay renderer: dim layer, spotlight ring around the targeted element (computed via `getBoundingClientRect` + `ResizeObserver`), popover card with title/body/Next/Back/Skip, and centered modal variant when no target.
- `src/components/tour/tourSteps.ts` — declarative step list (the outline above) with `{ route, target?, title, body, placement? }`.
- `src/components/tour/TourLaunchButton.tsx` — small floating/help-corner button visible on every page (lives in `AppLayout`). Clicking starts/resumes the tour.
- `src/components/tour/TourWelcomeBanner.tsx` — one-time toast/banner after sign-in for Clara/Theo, dismissible, with a "Take the tour" CTA.

Modified:
- `src/components/layout/AppLayout.tsx` — wrap children in `<TourProvider>`, mount `<EmbarkTour />`, `<TourLaunchButton />`, and `<TourWelcomeBanner />`.
- A handful of components get `data-tour="…"` attributes on the elements that get spotlighted (Embark chat panel, journey accordion, lens pills, Cohort Hub sections, Action Centre cards, My 360 sections, Role Play list). No logic changes — purely attribute additions.

## Persona gating
- Show the launch button and the welcome banner **only when** the active user's employee id is `rb-l6` (Clara) or `rb-l3` (Theo). All other users see neither — this matches the existing demo-deterministic-flow pattern (see memory: Rathbones Demo Deterministic Flows).
- The user can still trigger `start()` programmatically if needed (kept simple — gating is just on the entry points).

## Navigation behaviour
- Each step declares its route. Advancing to a step on a different route calls `navigate(step.route)` and waits one frame for the target element to mount before spotlighting (uses a small retry loop with `requestAnimationFrame`).
- If a target selector can't be found within ~800 ms, fall back to centered-modal rendering for that step so the tour never dead-ends.

## Visual style
- Dim layer: `bg-background/80 backdrop-blur-sm` with a CSS-clip cutout for the spotlight rect (4 px ring, 8 px radius, soft outer glow with `hsl(var(--accent))`).
- Popover card: `rounded-xl border bg-card shadow-card p-4 max-w-sm` with header (step n/total + section name), body, and Skip/Back/Next button row using existing `<Button>` variants.
- No new colour tokens; everything via semantic tokens already in the design system.

## Out of scope
- Persisting tour progress server-side (localStorage only).
- Translating any step content.
- Adapting the existing `FirstLoginTour` (kept as-is; it's a different artefact).
- Auto-launching the tour without a click — we only show the dismissible banner on first sign-in.

## Files touched (summary)
- New: `TourContext.tsx`, `EmbarkTour.tsx`, `tourSteps.ts`, `TourLaunchButton.tsx`, `TourWelcomeBanner.tsx`
- Edited: `AppLayout.tsx`, and ~6 page/component files to add `data-tour` attributes on spotlight targets (Embark journey, lens pills, Cohort Hub, Action Centre, My 360, Role Play Bank)
