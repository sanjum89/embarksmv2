
-- Competency + adaptation layer for Associate IM (Clara + Theo demo)

CREATE TABLE public.competency_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  competency_id text NOT NULL,
  track_code text NOT NULL,
  competency_name text NOT NULL,
  short_description text,
  supporting_skills text[] NOT NULL DEFAULT '{}',
  risk_critical boolean NOT NULL DEFAULT false,
  evidence_needed text,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, competency_id)
);

CREATE TABLE public.role_competency_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  role_cohort_code text NOT NULL,
  competency_id text NOT NULL,
  required_level integer NOT NULL CHECK (required_level BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, role_cohort_code, competency_id)
);

CREATE TABLE public.persona_competency_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  competency_id text NOT NULL,
  current_level integer NOT NULL CHECK (current_level BETWEEN 1 AND 5),
  short_rationale text,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  validation_needed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, persona_code, competency_id)
);

CREATE TABLE public.module_competency_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  module_code text NOT NULL,
  primary_competency_id text NOT NULL,
  secondary_competency_ids text[] NOT NULL DEFAULT '{}',
  risk_critical boolean NOT NULL DEFAULT false,
  default_delivery text NOT NULL DEFAULT 'full_module',
  can_be_microlearning boolean NOT NULL DEFAULT true,
  can_be_diagnostic_only boolean NOT NULL DEFAULT true,
  can_be_skipped_after_validation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, module_code)
);

CREATE TABLE public.persona_module_adaptations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  module_code text NOT NULL,
  adaptation_type text NOT NULL CHECK (adaptation_type IN ('full_module','microlearning','diagnostic_only','evidence_required','skip_after_validation')),
  reason text,
  visible_to_learner boolean NOT NULL DEFAULT true,
  manager_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, persona_code, module_code)
);

ALTER TABLE public.competency_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_competency_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_competency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_competency_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_module_adaptations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['competency_catalog','role_competency_requirements','persona_competency_profiles','module_competency_tags','persona_module_adaptations'])
  LOOP
    EXECUTE format('CREATE POLICY "anon_select_%1$s" ON public.%1$s FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "anon_insert_%1$s" ON public.%1$s FOR INSERT WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY "anon_update_%1$s" ON public.%1$s FOR UPDATE USING (true);', t);
    EXECUTE format('CREATE POLICY "anon_delete_%1$s" ON public.%1$s FOR DELETE USING (true);', t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t);
  END LOOP;
END$$;

CREATE INDEX idx_pcp_account_persona ON public.persona_competency_profiles (account_id, persona_code);
CREATE INDEX idx_mct_account_module ON public.module_competency_tags (account_id, module_code);
CREATE INDEX idx_pma_account_persona ON public.persona_module_adaptations (account_id, persona_code);
CREATE INDEX idx_rcr_account_role ON public.role_competency_requirements (account_id, role_cohort_code);
