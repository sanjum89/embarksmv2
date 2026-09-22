
-- Reflections table: stores submitted reflections
CREATE TABLE embarksmv2.reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES embarksmv2.accounts(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  manager_id text NOT NULL DEFAULT 'system',
  trigger_type text NOT NULL DEFAULT 'system_bootstrap',
  topic text NOT NULL DEFAULT '',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  additional_notes text,
  summary text,
  raw_conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  manager_feedback text,
  skills_extracted jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);

ALTER TABLE embarksmv2.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reflections" ON embarksmv2.reflections FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert reflections" ON embarksmv2.reflections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update reflections" ON embarksmv2.reflections FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete reflections" ON embarksmv2.reflections FOR DELETE TO public USING (true);

-- Reflection requests table: stores manager requests before learner acts
CREATE TABLE embarksmv2.reflection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES embarksmv2.accounts(id) ON DELETE CASCADE,
  manager_employee_id text NOT NULL,
  target_employee_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  topic text NOT NULL DEFAULT 'general_progress',
  custom_message text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE embarksmv2.reflection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reflection_requests" ON embarksmv2.reflection_requests FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert reflection_requests" ON embarksmv2.reflection_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update reflection_requests" ON embarksmv2.reflection_requests FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete reflection_requests" ON embarksmv2.reflection_requests FOR DELETE TO public USING (true);
