# Fix the learning-flow logic in Clara's (and Theo's) journey

## What I found in the data

I checked the actual saved records for Clara (learner record `rb-l6`) and Theo (`rb-l3`) on the Performance & Attribution module shown in the screenshot.

1. **Both a failed midpoint and a failed final are stored.** Clara has 10 saved midpoint attempts (scores 0, 33, 67 repeated) plus one final module assessment at 25%. Nothing stops a learner from opening the final assessment while the midpoint is failed and chapters 4-6 are still untouched — so the screenshot state is real, not a display bug.
2. **Repeat attempts are not numbered.** Every one of those 10 attempts is saved as "attempt 1", so the screen just shows whichever row happens to be newest (67%). Retake history is therefore meaningless.
3. **A failed midpoint does not reopen anything.** Chapters 1-3 are still marked complete and no reopen record exists. The reopen step only runs when the assessment result carries the chapters each wrong answer came from, and the midpoint quiz does not send them.
4. **Micro-learnings are created but invisible.** 20 micro-learnings exist for Clara on this module, all still "pending" and all with an empty chapter list, so none of them appear in her journey. The three micro-learning cards that *do* show up were hand-added to the shared course catalogue, which means every learner sees them regardless of who actually failed.
5. **No gap module when someone passes with a gap.** There is no rule that creates follow-up content for a pass with a 10-20% shortfall. Wrong answers on a passing attempt only produce the same invisible pending micro-learnings.
6. **Pass marks disagree across the app.** The assessments themselves are set to 80% to pass, the reopen logic uses its own hardcoded 80%, the topic-weakness logic uses 60%, and earlier demo seeding treated 70% as a pass. That is why some attempts read "Failed 71%" while still being recorded as completed.
7. **The earlier demo seeding went to the wrong people.** The 70%-pass + micro-learning arc was written onto `rb-l1`/`rb-l2`, but Clara is `rb-l6` and Theo is `rb-l3`.

## What to change

### One set of rules for the whole flow
- Single source of truth for the pass mark: the assessment's own `passing_score` (80%). Remove the hardcoded 80/70/60 variants from the submission and retention logic.
- Outcome bands, applied identically to midpoint, module and milestone assessments:
  - **Below pass** → fail: reopen every chapter that fed the wrong answers, lock the retake until those chapters are done again, create micro-learnings for each wrong answer.
  - **Pass with a gap (pass mark up to pass mark + 20, i.e. any pass below 100 with wrong answers)** → pass, no reopen, but create one visible gap chapter per weak topic, capped at two.
  - **Clean pass** → nothing injected.

### Gating so the impossible state can't happen
- The final module assessment stays locked until all its chapters are complete **and** the midpoint has been passed. Preview stays allowed; submission does not.
- A failed assessment is locked for retake until its reopened chapters are completed again, using the retake-lock field that already exists on the record but is currently left empty.

### Reopen that actually works
- When a chapter quiz or module assessment is failed, reopen the chapters that taught the missed topics — falling back to "all completed chapters in this module before the assessment" when the question data carries no chapter mapping (which is the case for the midpoint quiz today).
- Reopened chapters flip back to in-progress, the module drops out of "complete", and the journey's "You are here" marker lands on the first reopened chapter.

### Micro-learning and gap chapters become per-learner
- Stop adding micro-learning rows to the shared course catalogue. Instead render them in the journey from that learner's own micro-learning records, inserted directly beneath the assessment that triggered them, tagged "Micro-learning" (fail) or "Gap module" (pass with gap).
- Every generated micro-learning must have real content; empty ones are not shown and are regenerated on demand.
- Completing a micro-learning marks it complete and unlocks the retake when all reopened chapters are also done.

### Clean up and reseed the demo data
- Collapse the 10 duplicate midpoint attempts into a numbered attempt history (one row per real attempt), remove the 0% noise rows, and clear the orphaned empty micro-learnings.
- Reseed Clara (`rb-l6`) and Theo (`rb-l3`) so each demonstrates the full flow coherently and consistently with the new rules:
  - Clara: most modules complete; one module where she failed the midpoint → chapters reopened + a micro-learning below it, retake locked; one module where she passed at 82% with a gap → one tagged gap chapter; the final assessment of the reopened module locked rather than failed.
  - Theo: same shape, earlier in the journey — a just-passed midpoint with a gap chapter, and one failed retake showing attempt 1 and attempt 2.
- Re-run the Pinnacle mirror afterwards so the copy matches.

## Technical notes
- Shared rules move into one module (extending `src/lib/assessmentSubmission.ts` and `src/lib/assessmentGates.ts`); `retentionEngine.ts` reuses the same threshold instead of its own.
- `useLearnerJourney.ts`: dedupe attempts by `(blueprint_code|chapter_code, attempt_number)` taking the latest, derive `attemptCount`; join `micro_learnings` for the learner and inject them as virtual chapters after their source assessment; compute the module-assessment lock from chapter completion + midpoint outcome.
- `LearnPathChapterRow.tsx` / `JourneyModuleAccordion.tsx`: badges for Locked (retake blocked), Micro-learning, Gap module, and `Attempt n`.
- Data fixes go through a migration for the uniqueness/attempt-numbering constraint plus data statements for the reseed; `mirror_account_content` is re-run for Pinnacle.
