
CREATE TABLE public.employee_capability_proficiency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  employee_id text NOT NULL,
  capability_code text NOT NULL,
  current_level integer NOT NULL CHECK (current_level BETWEEN 1 AND 5),
  source text NOT NULL DEFAULT 'seeded',
  confidence text NOT NULL DEFAULT 'medium',
  validation_needed boolean NOT NULL DEFAULT false,
  short_rationale text,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, employee_id, capability_code)
);
CREATE INDEX idx_emp_cap_prof_account_employee ON public.employee_capability_proficiency(account_id, employee_id);
CREATE INDEX idx_emp_cap_prof_capability ON public.employee_capability_proficiency(capability_code);
ALTER TABLE public.employee_capability_proficiency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_ecp" ON public.employee_capability_proficiency FOR SELECT USING (true);
CREATE POLICY "anon_insert_ecp" ON public.employee_capability_proficiency FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_ecp" ON public.employee_capability_proficiency FOR UPDATE USING (true);
CREATE POLICY "anon_delete_ecp" ON public.employee_capability_proficiency FOR DELETE USING (true);
CREATE TRIGGER set_updated_at_ecp BEFORE UPDATE ON public.employee_capability_proficiency
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.role_capability_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  role_cohort_code text NOT NULL,
  capability_code text NOT NULL,
  required_level integer NOT NULL CHECK (required_level BETWEEN 1 AND 5),
  criticality text NOT NULL DEFAULT 'standard',
  source_module_codes text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, role_cohort_code, capability_code)
);
CREATE INDEX idx_role_cap_req_account_role ON public.role_capability_requirements(account_id, role_cohort_code);
ALTER TABLE public.role_capability_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_rcr2" ON public.role_capability_requirements FOR SELECT USING (true);
CREATE POLICY "anon_insert_rcr2" ON public.role_capability_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_rcr2" ON public.role_capability_requirements FOR UPDATE USING (true);
CREATE POLICY "anon_delete_rcr2" ON public.role_capability_requirements FOR DELETE USING (true);
CREATE TRIGGER set_updated_at_rcr2 BEFORE UPDATE ON public.role_capability_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
