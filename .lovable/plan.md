# End-to-End Test: Clara — Business Knowledge + Technical Knowledge

## Goal

Walk Clara through every chapter of two full Rathbones tracks in the live preview, confirming the cohort journey advances correctly chapter-by-chapter, module-by-module, and across the BK → TK track boundary. Targets the recently-fixed completion-screen / next-chapter logic.

## Scope

**Account:** Rathbones (`6c49ca7c-fecb-4b34-a690-7e4e28bb2194`)
**Learner:** Clara Wren (mid__in_im, primary onboarding persona)
**Tracks (33 chapters across 13 modules):**

```text
Business Knowledge (5 modules)
  bk1.intro_wealth_rathbones        (3 chapters)
  bk2.kyc_suitability               (3)
  bk3.markets_macro_assets          (3)
  bk4.portfolio_construction        (3)
  bk5.regulatory_landscape          (3)

Technical Knowledge (7 core + 1 stretch = 8 modules)
  tk1.charles_river_ims             (3)
  tk2.bloomberg_essentials          (2)
  tk3.performance_attribution       (3)
  tk4.risk_mandate_restrictions     (2)
  tk5.tax_wrappers                  (2)
  tk6.esg_responsible_investing     (2)
  tk7.ops_workflows                 (2)
  str2.investment_thesis            (stretch — included if surfaced to Clara)
```

## Pre-flight (one-time DB work)

1. Resolve Clara's `employee_id` and active `cohort_id` from `cohort_enrollments` joined to her persona assignment (`rb-l1` / Clara Wren).
2. **Reset progress** for the BK+TK module set:
   ```sql
   DELETE FROM learner_progress
   WHERE account_id = '<rathbones>' AND employee_id = '<clara>'
     AND module_code IN (<bk1..bk5, tk1..tk7, str2>);
   DELETE FROM chapter_lock_events
   WHERE account_id = '<rathbones>' AND employee_id = '<clara>'
     AND module_code IN (<same set>);
   ```
3. Snapshot Clara's expected starting state (first chapter of bk1 should be "available", everything else gated by track sequencing).

## Test loop (per chapter)

For each of the 33 chapters in displayOrder:

1. `observe` — confirm chapter title, "Mark as Complete" CTA visible, mode selector present.
2. `act` click "Mark as Complete".
3. `observe` — completion screen rendered with stats (Time Spent, Assessment, Progress, Streak).
4. Screenshot only at module boundaries and on any anomaly.
5. `act` click "Continue to Next Chapter" (don't wait for the 5 s auto-advance — keeps the run tight).
6. Verify the next chapter's URL/title matches the expected next entry from `flattenJourney(BK+TK)`.

## Boundary checks (the bug-prone spots)

- **End of each module → first chapter of next module in same track.** Asserts `findNextCohortChapter` returns the new module's first chapter even while it's still flagged `locked`.
- **End of bk5.c3 → first chapter of tk1 (track switch).** Same logic across track boundaries.
- **End of tk7.c2 (or str2's last chapter) → CompletionScreen shows "Back to All Chapters" only.** Asserts terminal state is reachable.
- After every "Mark as Complete", reload `useLearnerJourney` (refreshJourney is fired automatically by `onChapterPersisted`) and confirm the chapter status flips to `completed` in the journey panel.

## Side-checks at module boundaries

At the end of each module, briefly verify:
- Module pill in the journey panel turns green / "Completed".
- Action Centre / Embark AI panel reflects the new resume point.
- No stuck "Loading…" spinner, no console errors (will read browser console once per track).

## Deliverable

A single test report covering:
- Per-chapter pass/fail (33 rows).
- Per-module-boundary advance pass/fail (12 transitions inside tracks + 1 BK→TK + 1 final terminal).
- Any visual/console issues encountered, with screenshot.
- Final DB state confirmation: `learner_progress` rows for all 33 chapters with `status='completed'`.
- Verdict on whether the recent CompletionScreen / `findNextCohortChapter` fix holds end-to-end.

## Notes / risks

- **Mutates Clara's progress.** Will leave her with both tracks fully completed unless rolled back. I'll reset before, and offer to reset again after if you want her returned to her current state.
- **Auto-advance is 5 s per chapter.** Clicking "Continue" manually skips that wait — full run estimated 8–12 minutes of browser actions.
- **Browser session must already be logged in as Clara in the preview.** If the browser lands on the auth screen I'll stop and ask you to sign in.
- **Won't touch assessments / role-plays.** If a chapter requires an assessment to advance, I'll flag it and skip rather than auto-pass — completion of *learning* chapters is the contract being tested.