## Why Clara's BK track looks broken

Clara's adaptation profile for the Business Knowledge track:

| Module | Lens | What that adds to the journey |
|---|---|---|
| bk1 Intro to Wealth | `diagnostic_only` | Synthetic "Quick diagnostic — 3 questions" row + `bk1.c_micro_fees` micro |
| bk2 KYC & Suitability | `microlearning` | `bk2.c_micro_vuln` micro + `bk2.bp_mid` milestone check |
| bk3 Markets & Macro | `diagnostic_only` | Synthetic Quick diagnostic row |
| bk4 Portfolio Construction | `microlearning` | `bk4.c_micro_rebalance` micro |
| bk5 Regulatory Landscape | `full_module` | (no extras) |

Three things are leaking through:

1. **"YOU ARE HERE" on Chapter 01 of bk1.** The Quick Diagnostic is a synthetic row (`__diag::bk1.intro_wealth_rathbones`) injected by `JourneyModuleAccordion.buildLensChapters`. It looks at the `diagnosticReopens` store / `learner_progress` for a row with `chapter_code='__diag'` and `metadata.diagnostic_result`. Clara has **no** `__diag` row, so the synthetic step renders as `in_progress` → the "You are here" marker lands on it. Same issue exists for bk3.

2. **Micro-learnings show as not-completed.** `catalog_chapters` has `bk1.c_micro_fees`, `bk2.c_micro_vuln`, `bk4.c_micro_rebalance`, but `learner_progress` has **no rows** for any of them under Clara — so they default to `not_started`. (Despite a previous migration claiming to mark them complete, the rows are missing for `rb-l6`.)

3. **bk2 milestone shows "Failed · 0%".** `assessment_instances` has Clara's latest `bk2.bp_mid` attempt at `score=0.00, status=locked` (from when the failed-assessment bug fired on login). Passing score is 80.

Everything else on the BK track is already `completed` (chapters c1–c8, midpoint chapter, and all `bp_post` blueprints scoring 82–88).

## Fix — data-only migration on `rb-l6` in cohort `11111111-…-111111111111`

All changes go through one Supabase migration. No frontend code changes needed; the existing lens / accordion logic already renders the correct visuals once the data is right.

### A. Backfill micro-learning completions

Insert (idempotent) a `completed` `learner_progress` row for each micro:

```text
bk1.intro_wealth_rathbones  / bk1.c_micro_fees
bk2.kyc_suitability         / bk2.c_micro_vuln
bk4.portfolio_construction  / bk4.c_micro_rebalance
```

Use `ON CONFLICT (cohort_id, employee_id, chapter_code) DO UPDATE SET status='completed', completed_at=now()`.

### B. Submit the synthetic Quick Diagnostics

Insert `__diag` `learner_progress` rows for bk1 and bk3 with `metadata.diagnostic_result = { total: 3, correct: 3, wrong_chapters: [] }`. This causes `buildLensChapters` to render the synthetic diagnostic as `completed` (clearing the "YOU ARE HERE" marker) and marks the first 3 foundational chapters as `skipped_by_diagnostic` — the intended visual for a mid-career learner who already knows the basics. Because the underlying chapter rows in `learner_progress` are already `completed`, the module's "10 of 11" counter (computed in `useLearnerJourney` before the lens) stays at 100%.

### C. Pass the bk2 milestone check

Update Clara's latest `assessment_instances` row for `blueprint_code='bk2.bp_mid'`:

- `score = 82`
- `status = 'completed'`
- `completed_at` set to a date between her bk2 chapters and her bk2.bp_post attempt so the timeline stays sensible

This flips the milestone from `Failed · 0%` to a passing badge.

### D. Out of scope

- Theo / other personas — only Clara was requested.
- `tk3.performance_attribution` (Technical Knowledge track) — Clara is intentionally still in-progress there and the user said "entire business knowledge track", not the tech track.
- No changes to `passing_score`, blueprint definitions, or any catalog/chapters rows.

## Verification

After approval and migration:

1. Re-query `learner_progress` for `rb-l6` — expect 3 new micro rows + 2 new `__diag` rows, all `completed`.
2. Re-query `assessment_instances` — `bk2.bp_mid` row should read `score=82, status='completed'`.
3. Visually confirm in preview that bk1–bk5 each render as IN PROGRESS → COMPLETED with no failed badges, no "YOU ARE HERE" marker on the BK track, and micro-learning rows show a green check.
