
-- 1. Create agent_one_events table
CREATE TABLE public.agent_one_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  category text NOT NULL,
  source_user_id text,
  source_employee_id text,
  target_user_id text,
  target_employee_id text,
  related_employee_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_skill_target_id text,
  related_role_play_id text,
  related_assessment_id text,
  related_mentor_employee_id text,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_one_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agent_one_events" ON public.agent_one_events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agent_one_events" ON public.agent_one_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agent_one_events" ON public.agent_one_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete agent_one_events" ON public.agent_one_events FOR DELETE USING (true);

-- 2. Create mentor_assignments table
CREATE TABLE public.mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  mentor_employee_id text NOT NULL,
  mentee_employee_id text NOT NULL,
  assigned_by_user_id text NOT NULL,
  reason text,
  focus_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  start_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read mentor_assignments" ON public.mentor_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert mentor_assignments" ON public.mentor_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update mentor_assignments" ON public.mentor_assignments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete mentor_assignments" ON public.mentor_assignments FOR DELETE USING (true);

-- 3. Extend nudge_cards with new columns
ALTER TABLE public.nudge_cards ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'shared';
ALTER TABLE public.nudge_cards ADD COLUMN IF NOT EXISTS source_event_id uuid;
ALTER TABLE public.nudge_cards ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.nudge_cards ADD COLUMN IF NOT EXISTS grouping_key text;
ALTER TABLE public.nudge_cards ADD COLUMN IF NOT EXISTS recipient_employee_id text;
