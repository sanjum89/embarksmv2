## What's wrong

Two distinct gaps in the journey:

1. **Midpoint Checks render as regular chapters.** They live in `catalog_chapters` with `chapter_code` ending `.midpoint` and `content_type='quiz'` (24 rows across the Rathbones cohort, each with 2–3 `diagnostic_questions`). `JourneyModuleAccordion.tsx`'s `isAssessment` check only matches `contentType === "assessment" | "diagnostic"`, so `quiz` slips through and they open in the reading view.
2. **Module-post assessments are missing entirely.** `catalog_assessment_blueprints` has 30 `module_post` rows and 1 `milestone` row (`bk2.bp_mid`), but `useLearnerJourney` only iterates `catalog_chapters`, so the real per-module post-assessment never appears in the journey. The only assessment a learner ever sees is the synthetic "Quick diagnostic — 3 questions" from the `diagnostic_only` lens.

A third issue, surfaced by your follow-up: **submitting one of these new assessments wouldn't generate micro-learnings or reopen chapters today**, because the existing `LearnPathAssessment` submit path only calls `applyGateActions` (legacy skill-target step toggling). The micro-learning + lock + reopen pipeline lives in `onDiagnosticSubmit` inside `LearnPathContent.tsx` and is wired only to the synthetic diagnostic.

## Fix

### 1. Treat `quiz` chapters as assessments

- Extend `isAssessment` in `JourneyModuleAccordion.tsx` to include `contentType === "quiz"` and any `chapter_code` matching `*.midpoint`. Use the ClipboardCheck icon and a "Midpoint check" badge; show score pill once attempted.
- In `LearnPathContent.tsx`, when the active step's `contentType` is `quiz`/`assessment`, render `LearnPathAssessment` (not the chapter reading view).
- In `src/lib/assessmentGates.ts`, add a resolver branch: when the id is a chapter code with `content_type='quiz'`, build an `Assessment` from that chapter's `diagnostic_questions` (title = chapter title, passingScore = 70, type = "post"). Pull from the `useCatalogChapter` cache so we don't re-fetch.

### 2. Surface module-post + milestone assessments as journey steps

- Extend `useLearnerJourney` to also query `catalog_assessment_blueprints` (scopes `module_post` and `milestone`) and inject synthetic chapter rows:
  - `code = blueprint_code`, `contentType = "assessment"`.
  - `module_post`: appended last in its module, title `"Module assessment — {module title}"`.
  - `milestone` (`bk2.bp_mid`): inserted next to the matching midpoint chapter, title `"Milestone check — KYC & Suitability"`.
  - `status` derived from the latest matching `assessment_instances` row (passed = completed, locked = locked, else available/locked by preceding-chapter completion).
- Resolver branch in `assessmentGates.ts`: when id matches a blueprint code, build an `Assessment` from `blueprint.topic_outline` + the existing template-question generator, using `blueprint.passing_score`.

### 3. Wire micro-learning, chapter reopen, and lock into the assessment submit path

This is the part your question was getting at — without it, the new assessments would just record a score and move on.

Refactor the post-submit pipeline that currently lives inline in `onDiagnosticSubmit` into a shared `handleAssessmentSubmission` helper (new file `src/lib/assessmentSubmission.ts` or co-located in `assessmentGates.ts`) that takes `{ assessmentId, score, sourceKind: "diagnostic" | "midpoint" | "module_post" | "milestone", wrongQuestions, moduleCode, chapterCodes, employeeId, accountId, cohortId }` and:

- **<100%** → for every wrong question, invoke `generate-micro-learning` and insert a `micro_learnings` row (pending) so it shows up in Action Centre and the Embark journey (existing surfacing already works once rows exist).
- **<80%** → also write `chapter_lock_events` rows for the source chapters behind the wrong topic tags (reopen them) and insert an `assessment_instances` row with `status='locked'` + populated `locks_retake_until_chapters`. The existing retry-guard in `DiagnosticResultsCard` already disables Retake while reopened chapters remain incomplete.
- **<20%** → keep existing critical-fail reopen-all behaviour.

Then:

- Call the new helper from **both** `onDiagnosticSubmit` (drop the inline copy) **and** `LearnPathAssessment.onSubmit` after `applyGateActions` runs. `LearnPathAssessment` already has `answers` and the resolved `Assessment`, so deriving `wrongQuestions` is local; `moduleCode` is the parent module of the chapter/blueprint step.
- Source chapters for `module_post`: read `topic_outline[*].linked_chapters` from the blueprint. For `quiz` chapters (midpoint), reopen the chapters in the same module that precede the midpoint and whose `topic_tags` intersect the wrong question's tags.

### 4. Verification

- Open Clara's journey at `/`:
  - Every module accordion ends with a "Module assessment" row with assessment styling.
  - `bk2.kyc_suitability` shows a "Milestone check" row mid-module.
  - The 24 `*.midpoint` chapters render with assessment styling, not reading.
- Click a Midpoint Check → assessment runner opens with the chapter's `diagnostic_questions`. Submit at 85% → 1 micro-learning appears in Action Centre; assessment retryable. Submit at 65% → micro-learning created, source chapters reopen with badge, assessment row shows locked + Retake disabled until reopened chapters are completed.
- Repeat the same two cases on a Module assessment — identical behaviour.
- Re-run the existing diagnostic → unchanged behaviour (because the diagnostic is now using the same shared helper).

### Files touched

- `src/hooks/useLearnerJourney.ts` — inject blueprint-backed steps.
- `src/components/learnpath/JourneyModuleAccordion.tsx` — expand `isAssessment`, midpoint/post styling.
- `src/components/learnpath/LearnPathContent.tsx` — route quiz/assessment steps into `LearnPathAssessment`; delegate diagnostic submit to the shared helper.
- `src/components/learnpath/LearnPathAssessment.tsx` — call the shared submission helper after `applyGateActions`.
- `src/lib/assessmentGates.ts` — resolver branches for chapter-quiz and blueprint-backed assessments.
- `src/lib/assessmentSubmission.ts` (new) — shared micro-learning + reopen + lock pipeline.
- `src/hooks/useCatalogChapter.ts` — small helper export so the resolver can read `diagnostic_questions` from cache.

### Out of scope

- Regenerating question banks (use existing `diagnostic_questions` + `topic_outline` + template generator).
- Changing the diagnostic lens itself or the Action Centre micro-learning UI.
- Manager-facing analytics changes.

Reply **continue** to implement.