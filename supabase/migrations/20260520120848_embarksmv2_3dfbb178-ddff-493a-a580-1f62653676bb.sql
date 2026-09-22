
CREATE TABLE embarksmv2.persona_profile_basics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, persona_code)
);

CREATE TABLE embarksmv2.persona_career_here (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, persona_code)
);

CREATE TABLE embarksmv2.persona_aspiration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, persona_code)
);

CREATE TABLE embarksmv2.persona_manager_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  feedback_at date,
  author_label text,
  sentiment text DEFAULT 'positive',
  body text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE embarksmv2.persona_stretch_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  title text NOT NULL,
  detail text,
  status text DEFAULT 'in_progress',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE embarksmv2.persona_potential_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  role_title text NOT NULL,
  fit_percent int NOT NULL DEFAULT 50,
  horizon_months int,
  rationale text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE embarksmv2.persona_succession_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  persona_code text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, persona_code)
);

ALTER TABLE embarksmv2.persona_profile_basics ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarksmv2.persona_career_here ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarksmv2.persona_aspiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarksmv2.persona_manager_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarksmv2.persona_stretch_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarksmv2.persona_potential_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarksmv2.persona_succession_notes ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'persona_profile_basics','persona_career_here','persona_aspiration',
    'persona_manager_feedback','persona_stretch_tasks','persona_potential_roles',
    'persona_succession_notes'
  ]) LOOP
    EXECUTE format('CREATE POLICY "anon_read_%I" ON embarksmv2.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_insert_%I" ON embarksmv2.%I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_update_%I" ON embarksmv2.%I FOR UPDATE USING (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_delete_%I" ON embarksmv2.%I FOR DELETE USING (true)', t, t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON embarksmv2.%I FOR EACH ROW EXECUTE FUNCTION embarksmv2.set_updated_at()', t, t);
  END LOOP;
END $$;

CREATE INDEX idx_persona_manager_feedback_lookup ON embarksmv2.persona_manager_feedback (account_id, persona_code);
CREATE INDEX idx_persona_stretch_tasks_lookup ON embarksmv2.persona_stretch_tasks (account_id, persona_code);
CREATE INDEX idx_persona_potential_roles_lookup ON embarksmv2.persona_potential_roles (account_id, persona_code);
