
-- cohort_announcements
CREATE TABLE public.cohort_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  cohort_id uuid NOT NULL,
  author_employee_id text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  posted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cohort_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_cohort_announcements" ON public.cohort_announcements FOR SELECT USING (true);
CREATE POLICY "anon_insert_cohort_announcements" ON public.cohort_announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_cohort_announcements" ON public.cohort_announcements FOR UPDATE USING (true);
CREATE POLICY "anon_delete_cohort_announcements" ON public.cohort_announcements FOR DELETE USING (true);
CREATE TRIGGER set_updated_at_cohort_announcements BEFORE UPDATE ON public.cohort_announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_cohort_announcements_cohort ON public.cohort_announcements(cohort_id, posted_at DESC);

-- cohort_sessions
CREATE TABLE public.cohort_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  cohort_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'lead_led',
  title text NOT NULL,
  description text,
  host_employee_id text,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  capacity integer NOT NULL DEFAULT 30,
  joined_count integer NOT NULL DEFAULT 0,
  teams_link text,
  location text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cohort_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_cohort_sessions" ON public.cohort_sessions FOR SELECT USING (true);
CREATE POLICY "anon_insert_cohort_sessions" ON public.cohort_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_cohort_sessions" ON public.cohort_sessions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_cohort_sessions" ON public.cohort_sessions FOR DELETE USING (true);
CREATE TRIGGER set_updated_at_cohort_sessions BEFORE UPDATE ON public.cohort_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_cohort_sessions_cohort ON public.cohort_sessions(cohort_id, starts_at);

-- cohort_session_attendees
CREATE TABLE public.cohort_session_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  session_id uuid NOT NULL,
  employee_id text NOT NULL,
  status text NOT NULL DEFAULT 'joined',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cohort_session_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_cohort_session_attendees" ON public.cohort_session_attendees FOR SELECT USING (true);
CREATE POLICY "anon_insert_cohort_session_attendees" ON public.cohort_session_attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_cohort_session_attendees" ON public.cohort_session_attendees FOR UPDATE USING (true);
CREATE POLICY "anon_delete_cohort_session_attendees" ON public.cohort_session_attendees FOR DELETE USING (true);
CREATE TRIGGER set_updated_at_cohort_session_attendees BEFORE UPDATE ON public.cohort_session_attendees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE UNIQUE INDEX idx_cohort_session_attendees_unique ON public.cohort_session_attendees(session_id, employee_id);

-- cohort_study_groups
CREATE TABLE public.cohort_study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  cohort_id uuid NOT NULL,
  title text NOT NULL,
  focus text,
  schedule_text text,
  next_meeting_at timestamptz,
  member_employee_ids text[] NOT NULL DEFAULT '{}'::text[],
  teams_link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cohort_study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_cohort_study_groups" ON public.cohort_study_groups FOR SELECT USING (true);
CREATE POLICY "anon_insert_cohort_study_groups" ON public.cohort_study_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_cohort_study_groups" ON public.cohort_study_groups FOR UPDATE USING (true);
CREATE POLICY "anon_delete_cohort_study_groups" ON public.cohort_study_groups FOR DELETE USING (true);
CREATE TRIGGER set_updated_at_cohort_study_groups BEFORE UPDATE ON public.cohort_study_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_cohort_study_groups_cohort ON public.cohort_study_groups(cohort_id);
