
-- Replace the per-chapter unique index with one that also includes module_code,
-- so synthetic per-module rows (like '__diag') can exist once per module.
DROP INDEX IF EXISTS public.uq_learner_progress_chapter;
CREATE UNIQUE INDEX uq_learner_progress_chapter
  ON public.learner_progress (cohort_id, employee_id, module_code, chapter_code)
  WHERE chapter_code IS NOT NULL;

-- A. Backfill micro-learning completions for Clara (rb-l6)
INSERT INTO public.learner_progress
  (account_id, cohort_id, employee_id, module_code, chapter_code, status, started_at, completed_at)
VALUES
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'rb-l6',
   'bk1.intro_wealth_rathbones', 'bk1.c_micro_fees', 'completed', '2026-03-22 10:00:00+00', '2026-03-22 10:10:00+00'),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'rb-l6',
   'bk2.kyc_suitability', 'bk2.c_micro_vuln', 'completed', '2026-03-29 10:00:00+00', '2026-03-29 10:10:00+00'),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'rb-l6',
   'bk4.portfolio_construction', 'bk4.c_micro_rebalance', 'completed', '2026-04-12 10:00:00+00', '2026-04-12 10:10:00+00')
ON CONFLICT (cohort_id, employee_id, module_code, chapter_code) WHERE chapter_code IS NOT NULL
DO UPDATE SET status = 'completed', completed_at = EXCLUDED.completed_at;

-- B. Submit synthetic Quick Diagnostics for bk1 and bk3 (no wrong answers)
INSERT INTO public.learner_progress
  (account_id, cohort_id, employee_id, module_code, chapter_code, status, started_at, completed_at, metadata)
VALUES
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'rb-l6',
   'bk1.intro_wealth_rathbones', '__diag', 'completed', '2026-03-16 09:00:00+00', '2026-03-16 09:05:00+00',
   '{"diagnostic_result": {"total": 3, "correct": 3, "wrong_chapters": []}}'::jsonb),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'rb-l6',
   'bk3.markets_macro_assets', '__diag', 'completed', '2026-04-01 09:00:00+00', '2026-04-01 09:05:00+00',
   '{"diagnostic_result": {"total": 3, "correct": 3, "wrong_chapters": []}}'::jsonb)
ON CONFLICT (cohort_id, employee_id, module_code, chapter_code) WHERE chapter_code IS NOT NULL
DO UPDATE SET status = 'completed', completed_at = EXCLUDED.completed_at, metadata = EXCLUDED.metadata;

-- C. Pass Clara's bk2.bp_mid milestone (flip from Failed 0% to passing)
UPDATE public.assessment_instances
SET score = 82,
    status = 'completed',
    completed_at = '2026-03-28 11:30:00+00'
WHERE employee_id = 'rb-l6'
  AND cohort_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND blueprint_code = 'bk2.bp_mid';
