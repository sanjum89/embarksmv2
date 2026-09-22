
-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION embarksmv2.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ENUMS
CREATE TYPE embarksmv2.difficulty_level AS ENUM ('foundation','practitioner','advanced','leadership');
CREATE TYPE embarksmv2.delivery_mode AS ENUM ('digital','offline','blended','live_cohort','simulation','workplace_practice','coaching');
CREATE TYPE embarksmv2.chapter_content_type AS ENUM ('reading','video','case_study','client_scenario','simulation','system_practice','shadowing_task','coaching_discussion','mentor_discussion','peer_discussion','reflection','quiz','observed_practice','workplace_assignment');
CREATE TYPE embarksmv2.assessment_type AS ENUM ('diagnostic_knowledge_check','applied_client_scenario','investment_research_case','portfolio_construction_case','suitability_review','consumer_duty_judgement_case','regulatory_knowledge_check','ethical_dilemma','client_conversation_simulation','market_volatility_scenario','business_development_plan','observed_client_meeting','mentor_review','manager_signoff','assessor_review','readiness_board_evidence_pack','cpd_reflection','system_workflow_completion','ai_tool_usage_reflection');
CREATE TYPE embarksmv2.assessment_scope AS ENUM ('milestone','module_post','readiness_gate','adhoc');
CREATE TYPE embarksmv2.evidence_type AS ENUM ('quiz_score','written_case_response','simulation_score','observed_behaviour_note','manager_signoff','mentor_feedback','assessor_review','cpd_reflection','system_task_completion','workplace_assignment','client_meeting_observation','readiness_board_pack');
CREATE TYPE embarksmv2.reviewer_role AS ENUM ('manager','mentor','assessor','peer','self');
CREATE TYPE embarksmv2.submission_format AS ENUM ('written','upload','observation','system_record','recording');
CREATE TYPE embarksmv2.readiness_outcome AS ENUM ('not_ready','ready_with_support','ready','ready_for_stretch');
CREATE TYPE embarksmv2.agent_action AS ENUM ('continue','micro_learn','reopen_and_lock','manager_review');
CREATE TYPE embarksmv2.gate_requirement_kind AS ENUM ('track','module','assessment','evidence');
CREATE TYPE embarksmv2.promotion_trigger AS ENUM ('readiness_gate','stretch_completion','manager_initiated');

-- CATALOG
CREATE TABLE embarksmv2.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  code TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, code)
);

CREATE TABLE embarksmv2.role_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  domain_code TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, level_order INT NOT NULL,
  description TEXT, progression_stage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, domain_code, code)
);

CREATE TABLE embarksmv2.employee_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  code TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  default_role_progression_code TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, code)
);

CREATE TABLE embarksmv2.learning_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  code TEXT NOT NULL, name TEXT NOT NULL, description TEXT, display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, code)
);

CREATE TABLE embarksmv2.catalog_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  module_code TEXT NOT NULL, module_title TEXT NOT NULL,
  domain_code TEXT NOT NULL, role_cohort_code TEXT NOT NULL, learning_track_code TEXT NOT NULL,
  progression_stage TEXT, module_summary TEXT,
  target_capabilities TEXT[] NOT NULL DEFAULT '{}',
  estimated_effort_hours NUMERIC(6,2),
  difficulty_level embarksmv2.difficulty_level NOT NULL DEFAULT 'foundation',
  prerequisite_module_codes TEXT[] NOT NULL DEFAULT '{}',
  is_core_required BOOLEAN NOT NULL DEFAULT true,
  is_stretch_module BOOLEAN NOT NULL DEFAULT false,
  stretch_target_role_cohort TEXT,
  recommended_delivery_mode embarksmv2.delivery_mode NOT NULL DEFAULT 'digital',
  remediation_recommendation TEXT, stretch_recommendation TEXT,
  nudge_trigger_tags TEXT[] NOT NULL DEFAULT '{}',
  stretch_unlock_conditions TEXT[] NOT NULL DEFAULT '{}',
  risk_flags_if_not_completed TEXT[] NOT NULL DEFAULT '{}',
  manager_conversation_prompt TEXT, display_order INT NOT NULL DEFAULT 0,
  is_shell BOOLEAN NOT NULL DEFAULT false, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, module_code)
);
CREATE INDEX idx_catalog_modules_role ON embarksmv2.catalog_modules (account_id, role_cohort_code, learning_track_code);

CREATE TABLE embarksmv2.catalog_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  module_code TEXT NOT NULL, chapter_code TEXT NOT NULL, chapter_title TEXT NOT NULL,
  chapter_summary TEXT, learning_objective TEXT,
  content_type embarksmv2.chapter_content_type NOT NULL DEFAULT 'reading',
  estimated_time_minutes INT NOT NULL DEFAULT 25,
  difficulty_level embarksmv2.difficulty_level NOT NULL DEFAULT 'foundation',
  delivery_mode embarksmv2.delivery_mode NOT NULL DEFAULT 'digital',
  realistic_content_outline TEXT, practical_activity TEXT, reflection_prompt TEXT,
  related_capabilities TEXT[] NOT NULL DEFAULT '{}',
  topic_tags TEXT[] NOT NULL DEFAULT '{}',
  complexity NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  display_order INT NOT NULL DEFAULT 0, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, chapter_code)
);
CREATE INDEX idx_catalog_chapters_module ON embarksmv2.catalog_chapters (account_id, module_code, display_order);

CREATE TABLE embarksmv2.catalog_assessment_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  blueprint_code TEXT NOT NULL, module_code TEXT NOT NULL, chapter_code TEXT,
  scope embarksmv2.assessment_scope NOT NULL DEFAULT 'module_post',
  assessment_type embarksmv2.assessment_type NOT NULL,
  assessment_title TEXT NOT NULL, assessment_summary TEXT,
  pass_criteria TEXT, distinction_criteria TEXT,
  passing_score INT NOT NULL DEFAULT 80,
  scoring_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  realistic_synthetic_prompt_or_scenario TEXT, remediation_if_failed TEXT,
  evidence_generated TEXT[] NOT NULL DEFAULT '{}',
  topic_outline JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 0, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, blueprint_code)
);
CREATE INDEX idx_blueprints_module ON embarksmv2.catalog_assessment_blueprints (account_id, module_code);

CREATE TABLE embarksmv2.catalog_evidence_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  evidence_task_code TEXT NOT NULL, module_code TEXT NOT NULL,
  evidence_title TEXT NOT NULL, evidence_description TEXT,
  evidence_type embarksmv2.evidence_type NOT NULL,
  required_for_gate BOOLEAN NOT NULL DEFAULT false,
  reviewer_role embarksmv2.reviewer_role NOT NULL DEFAULT 'manager',
  submission_format embarksmv2.submission_format NOT NULL DEFAULT 'written',
  quality_indicators TEXT[] NOT NULL DEFAULT '{}',
  example_synthetic_evidence_summary TEXT,
  display_order INT NOT NULL DEFAULT 0, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, evidence_task_code)
);

CREATE TABLE embarksmv2.catalog_readiness_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  gate_code TEXT NOT NULL, gate_title TEXT NOT NULL,
  applies_to_role_cohort TEXT NOT NULL, target_next_role_or_stretch_level TEXT,
  behavioural_indicators TEXT[] NOT NULL DEFAULT '{}',
  business_impact_indicators TEXT[] NOT NULL DEFAULT '{}',
  manager_signoff_required BOOLEAN NOT NULL DEFAULT true,
  assessor_signoff_required BOOLEAN NOT NULL DEFAULT false,
  readiness_outcomes TEXT[] NOT NULL DEFAULT ARRAY['not_ready','ready_with_support','ready','ready_for_stretch']::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, gate_code)
);

CREATE TABLE embarksmv2.catalog_gate_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  gate_code TEXT NOT NULL,
  requirement_kind embarksmv2.gate_requirement_kind NOT NULL,
  requirement_code TEXT NOT NULL, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, gate_code, requirement_kind, requirement_code)
);

-- RUNTIME
CREATE TABLE embarksmv2.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_code TEXT NOT NULL, cohort_title TEXT NOT NULL,
  domain_code TEXT NOT NULL, role_cohort_code TEXT NOT NULL,
  start_date DATE, due_date DATE, common_assessment_date DATE,
  progress_check_max_per_module INT NOT NULL DEFAULT 3,
  assessment_pass_percentage INT NOT NULL DEFAULT 80,
  next_cohort_id UUID REFERENCES embarksmv2.cohorts(id) ON DELETE SET NULL,
  is_legacy_skill_target_wrapper BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, cohort_code)
);

CREATE TABLE embarksmv2.cohort_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, employee_id)
);

CREATE TABLE embarksmv2.employee_persona_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  employee_id TEXT NOT NULL, persona_code TEXT NOT NULL,
  role_progression_code TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, employee_id, persona_code)
);

CREATE TABLE embarksmv2.learner_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  module_code TEXT NOT NULL, chapter_code TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_learner_progress_chapter ON embarksmv2.learner_progress (cohort_id, employee_id, chapter_code) WHERE chapter_code IS NOT NULL;
CREATE UNIQUE INDEX uq_learner_progress_module ON embarksmv2.learner_progress (cohort_id, employee_id, module_code) WHERE chapter_code IS NULL;
CREATE INDEX idx_learner_progress_lookup ON embarksmv2.learner_progress (account_id, employee_id, cohort_id);

CREATE TABLE embarksmv2.chapter_lock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  chapter_code TEXT NOT NULL, module_code TEXT NOT NULL,
  triggered_by_assessment_id UUID, reason TEXT, unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE embarksmv2.assessment_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  blueprint_code TEXT, module_code TEXT, chapter_code TEXT,
  kind embarksmv2.assessment_scope NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  generated_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  learner_responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC(5,2),
  weak_topic_tags TEXT[] NOT NULL DEFAULT '{}',
  strong_topic_tags TEXT[] NOT NULL DEFAULT '{}',
  agent_action embarksmv2.agent_action,
  agent_rationale TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assessment_instances_lookup ON embarksmv2.assessment_instances (account_id, employee_id, cohort_id);

CREATE TABLE embarksmv2.micro_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  source_assessment_id UUID NOT NULL REFERENCES embarksmv2.assessment_instances(id) ON DELETE CASCADE,
  failed_question TEXT NOT NULL,
  learner_answer TEXT, correct_answer TEXT,
  why_wrong TEXT, teaching_content_outline TEXT, practical_activity TEXT,
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE embarksmv2.readiness_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL, gate_code TEXT NOT NULL,
  outcome embarksmv2.readiness_outcome,
  ai_recommendation embarksmv2.readiness_outcome,
  ai_rationale TEXT,
  manager_decision embarksmv2.readiness_outcome,
  manager_notes TEXT, manager_signed_off_at TIMESTAMPTZ,
  assessor_decision embarksmv2.readiness_outcome,
  assessor_notes TEXT, assessor_signed_off_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE embarksmv2.learner_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID NOT NULL REFERENCES embarksmv2.cohorts(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  total_assessment_attempts INT NOT NULL DEFAULT 0,
  total_retakes INT NOT NULL DEFAULT 0,
  total_micro_learnings INT NOT NULL DEFAULT 0,
  rolling_weak_topic_tags TEXT[] NOT NULL DEFAULT '{}',
  rolling_strong_topic_tags TEXT[] NOT NULL DEFAULT '{}',
  time_to_readiness_days NUMERIC(6,2),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, employee_id)
);

CREATE TABLE embarksmv2.promotion_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), account_id UUID NOT NULL,
  cohort_id UUID REFERENCES embarksmv2.cohorts(id) ON DELETE SET NULL,
  next_cohort_id UUID REFERENCES embarksmv2.cohorts(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL,
  current_role_cohort TEXT NOT NULL,
  target_role_cohort TEXT NOT NULL,
  delta_module_codes TEXT[] NOT NULL DEFAULT '{}',
  signal_strength NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  triggered_by embarksmv2.promotion_trigger NOT NULL DEFAULT 'readiness_gate',
  manager_decision TEXT, manager_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS + triggers
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'domains','role_progressions','employee_personas','learning_tracks',
    'catalog_modules','catalog_chapters','catalog_assessment_blueprints',
    'catalog_evidence_tasks','catalog_readiness_gates','catalog_gate_requirements',
    'cohorts','cohort_enrollments','employee_persona_assignments',
    'learner_progress','chapter_lock_events','assessment_instances',
    'micro_learnings','readiness_gate_results','learner_analytics','promotion_signals'
  ] LOOP
    EXECUTE format('ALTER TABLE embarksmv2.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "anon_read_%1$s" ON embarksmv2.%1$s FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "anon_insert_%1$s" ON embarksmv2.%1$s FOR INSERT WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY "anon_update_%1$s" ON embarksmv2.%1$s FOR UPDATE USING (true);', t);
    EXECUTE format('CREATE POLICY "anon_delete_%1$s" ON embarksmv2.%1$s FOR DELETE USING (true);', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON embarksmv2.%1$s FOR EACH ROW EXECUTE FUNCTION embarksmv2.set_updated_at();', t);
  END LOOP;
END $$;
