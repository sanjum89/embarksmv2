## Tour fixes — re-presented for approval

Four issues from the screenshots, plus the "always show assessment result" request.

### 1. Tour card overflows on wide-pane steps (Image 1)

When the target rect covers most of the viewport (Embark home, My 360, Role Play, Action Centre, Cohort Hub), Floating UI tries to anchor the card to an edge and pushes it off-screen at higher zoom.

- In `src/components/onboarding/EmbarkTour.tsx`, add support for `placement: "center"`.
- Auto-promote a step to centre placement when the target rect covers >60% of the viewport in both axes.
- `caretStyle()` returns `null` for centre placement (no pointer caret).
- In `src/components/onboarding/tourSteps.ts`, explicitly set `placement: "center"` on the steps that talk about the whole pane: `embark-home`, `my360`, `role-play`, `action-centre`, `cohort-hub`. Audit every other route's tour file the same way.

### 2. "Cohort → Track" step should point to the top header (Image 2)

The step currently anchors to the modules list. The copy is about cohort + tracks, which live in the header card above.

- In `src/pages/EmbarkJourneyView.tsx`, wrap `<JourneyHeaderCard>` + `<JourneyTrackTabs>` in a `<div data-tour="embark-cohort-header">`.
- Update the `embark-journey` step in `tourSteps.ts` to target `[data-tour="embark-cohort-header"]` with `placement: "bottom"` (or `"left"` if it sits inside a wide pane).

### 3. "Content adapts to you" should highlight only the modules section (Image 3)

Currently highlights the whole page.

- In `src/pages/EmbarkJourneyView.tsx`, wrap `<JourneyModuleAccordion>` in a `<div data-tour="embark-modules">`.
- Update both `adapt-intro` and `adapt-why` steps in `tourSteps.ts` to target `[data-tour="embark-modules"]` with `placement: "left"`.

### 4. Full lens explainer set (always 4)

`buildLensSteps.ts` currently emits 1–3 lens steps depending on which adaptations the persona has. The user wants a complete walkthrough — Condensed → Quick Diagnostic → Microlearning → Evidence Task — so learners always understand the whole adaptation vocabulary.

- In `src/components/onboarding/buildLensSteps.ts`, always emit all 4 lens steps regardless of persona.
- Add a `microlearning` entry to `LENS_CONFIG` with generic fallback copy when no concrete microlearning is found in the page.
- In `src/components/cohort/JourneyModuleAccordion.tsx`, add `data-tour="lens-microlearning"` to the `AdaptationBadge` rendered when `adaptation.adaptationType === "microlearning"`. Falls back to the page-level target when none exists, so the step still has somewhere to anchor.

### 5. Always show assessment score + pass/fail on chapter rows

Today, the score pill only appears after the learner has completed the chapter. The user wants score + pass/fail visible on any chapter that has an assessment, including midpoints already attempted.

- Extend `JourneyChapter` in `src/hooks/useLearnerJourney.ts` with optional fields: `assessmentScore`, `assessmentPassed`, `assessmentPassingScore`.
- After loading chapters, run one extra `assessment_instances` query filtered by `learner_id` + `chapter_code IN (...)` and merge the most recent attempt per chapter into the chapter rows.
- In `src/components/cohort/JourneyModuleAccordion.tsx`, when a chapter has `content_type === "assessment"` (or chapter_code matches the assessment pattern), set `type: "assessment"` and pass the score fields through.
- In `src/components/cohort/LearnPathChapterRow.tsx`, render a coloured pill under the title for assessment rows whenever score is present: green `"Passed · 86%"` or red `"Failed · 58%"`. Shows even when the chapter status is `in_progress` or `locked` (because the result already exists).

### Out of scope

- Reworking other tour copy.
- Showing pass/fail anywhere outside the journey accordion.
- Persisting changes to tour progress.

### Files to touch

- `src/components/onboarding/EmbarkTour.tsx`
- `src/components/onboarding/tourSteps.ts` (and any other per-route tour-steps files surfaced during audit)
- `src/components/onboarding/buildLensSteps.ts`
- `src/pages/EmbarkJourneyView.tsx`
- `src/components/cohort/JourneyModuleAccordion.tsx`
- `src/components/cohort/LearnPathChapterRow.tsx`
- `src/hooks/useLearnerJourney.ts`
- `src/pages/JourneyContent.tsx` (only if a wrapping `data-tour` attribute is needed here too)
