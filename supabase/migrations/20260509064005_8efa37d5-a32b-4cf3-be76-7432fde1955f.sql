ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'calculation_exercise';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'case_analysis';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'client_simulation_chat';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'client_simulation_voice';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'compliance_review_task';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'external_certification';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'knowledge_check_mcq';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'manager_observation';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'mentor_signoff';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'peer_review';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'portfolio_construction_task';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'presentation_assessed';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'reflective_journal';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'scenario_response';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'system_task_simulation';
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'written_long_form';

ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'case_writeup';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'manager_observation_form';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'mentor_feedback_form';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'peer_feedback';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'presentation_deck';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'shadowing_log';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'system_screenshot_pack';
ALTER TYPE evidence_type ADD VALUE IF NOT EXISTS 'trade_rationale';

ALTER TYPE delivery_mode ADD VALUE IF NOT EXISTS 'self_study';
ALTER TYPE delivery_mode ADD VALUE IF NOT EXISTS 'blended';