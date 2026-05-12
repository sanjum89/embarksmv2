-- Clean up stale completed learner_progress rows for Clara (rb-l6) on bk1.intro_wealth_rathbones
-- so the diagnostic-fail bug visibly self-corrects without requiring her to retake the diagnostic.
DELETE FROM public.learner_progress
WHERE account_id = '6c49ca7c-fecb-4b34-a690-7e4e28bb2194'
  AND employee_id = 'rb-l6'
  AND module_code = 'bk1.intro_wealth_rathbones'
  AND chapter_code IN ('bk1.c1', 'bk1.c2', 'bk1.c3');