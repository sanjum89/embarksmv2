ALTER TABLE public.micro_learnings
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'micro_learning';

ALTER TABLE public.micro_learnings
  DROP CONSTRAINT IF EXISTS micro_learnings_kind_check;
ALTER TABLE public.micro_learnings
  ADD CONSTRAINT micro_learnings_kind_check
  CHECK (kind IN ('micro_learning','gap_module'));

CREATE UNIQUE INDEX IF NOT EXISTS assessment_instances_attempt_uniq
  ON public.assessment_instances (
    account_id, cohort_id, employee_id,
    coalesce(blueprint_code, chapter_code, module_code),
    attempt_number
  );