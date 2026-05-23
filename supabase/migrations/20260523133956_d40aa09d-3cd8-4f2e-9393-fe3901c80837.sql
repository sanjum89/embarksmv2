-- Add unique index on (account_id, mentee_employee_id) so we can upsert
CREATE UNIQUE INDEX IF NOT EXISTS mentor_assignments_account_mentee_unique
  ON public.mentor_assignments (account_id, mentee_employee_id);