## Continue: frontend wiring + verified backfill

Picking up where the backend left off. Infrastructure (3 edge functions + DB columns) is live; now we wire it into the learner UI, fix the misleading labels, implement post-assessment micro-learning + chapter re-lock, and run a verified backfill.

### 1. Verified content backfill

- Fix the filter in `generate-catalog-chapters` invoker: treat `null` AND empty-string `chapter_long_form_content` as "needs content" (previous run skipped rows it shouldn't).
- Run in batches of 10 with a short delay; log each batch's success/skip counts.
- Re-query at the end and confirm all 163 Rathbones cohort chapters have ≥600 words + ≥3 `content_sections` + ≥2 `diagnostic_questions`.
- Add a "Backfill chapter content" button in `src/pages/DevTools.tsx` that calls the same function for ad-hoc top-ups.

### 2. Condensed module wiring (`useCatalogChapter`)

- Add a `persona` arg + new `lens === "condensed"` branch that:
  1. Reads `condensed_by_persona[persona]` from the cached row.
  2. If missing, calls `condense-chapter` edge function, caches the result on the row, and returns it.
  3. While loading, returns a "Preparing your condensed view" placeholder (no fake stub).
- `composeChapterTranscript` for `condensed` now uses the real condensed body, not a filtered-sections fake.

### 3. Honest UI labels

- `LearnPathModuleContent.tsx` / `LearnPathChapterRow.tsx`:
  - Replace in-body "Microlearning view" banner with "Condensed for you" — only render when a real condensed body exists.
  - Suppress the "Full Module" pill when active lens is `condensed`, `diagnostic`, or `evidence`.
  - Reserve the word "micro-learning" exclusively for assessment-generated artefacts in `micro_learnings`.
  - Empty content → "Content being prepared" state instead of a 26-word stub.

### 4. Post-assessment flow (`LearnPathAssessment.tsx` + `assessmentGates.ts`)

On submit:

- **100%** — unchanged.
- **<100% and ≥80%** — call `generate-micro-learning` with the wrong questions; insert `micro_learnings` rows; surface in Action Centre + Embark journey; allow retry.
- **<80%** — same as above PLUS:
  - Write `chapter_lock_events` rows for every source chapter behind the wrong questions (reopen them).
  - Set `assessment_instances.status = 'locked'` and populate `locks_retake_until_chapters` with those chapter codes.
  - UI shows "Locked — finish reopened chapters to retake" and disables Retry until `learner_progress` shows all reopened chapters re-completed.
- **<20%** — keep existing critical-fail path.

Chapter completion handler unlocks the assessment when the last reopened chapter is re-completed.

### 5. Surfaces

- Action Centre item kind `micro_learning_pending` → opens the micro-learning detail (renders `teaching_content_outline` + `practical_activity`, marks `completed` on submit).
- Embark journey injects pending micro-learnings as steps under the parent module.
- Reopened chapters get a "Reopened from assessment" badge in `LearnPathChapterRow`.

### 6. Audit & verification

- Extend `scripts/audit-clara-theo-content.ts` to fail on:
  - Any Rathbones cohort chapter with empty `chapter_long_form_content` or <3 `content_sections`.
  - Any `assessment_instances` row with score <100 but zero linked `micro_learnings`.
  - Any active `chapter_lock_events` without a corresponding locked assessment.
- Manual acceptance run as Clara:
  - Open *Risk-Adjusted Returns* chapter → real ~700-word Rathbones playbook body, no stub, no contradictory pills.
  - Switch to Condensed → shorter rewrite (cached after first view).
  - Quick diagnostic → 3 real questions.
  - Submit assessment at 85% → 1 micro-learning in Action Centre, assessment retryable.
  - Submit at 65% → micro-learning created, source chapters reopened with badge, assessment locked until they're re-completed.

### Files touched

- New dev button: `src/pages/DevTools.tsx`
- Edits: `src/hooks/useCatalogChapter.ts`, `src/components/learnpath/LearnPathContent.tsx`, `LearnPathModuleContent.tsx`, `LearnPathChapterRow.tsx`, `LearnPathAssessment.tsx`, `src/lib/assessmentGates.ts`, `src/pages/ActionCentre.tsx`, `src/lib/actionCentre/itemKinds.ts`, `src/hooks/useLearnerJourney.ts`, `scripts/audit-clara-theo-content.ts`
- No new migrations (columns from previous step are sufficient).

### Out of scope

- Replacing the cohort-first journey.
- Manager analytics beyond surfacing the new micro-learnings.
- Persona assignment changes.
