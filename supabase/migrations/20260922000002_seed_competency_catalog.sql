-- Seed competency_catalog for the Rathbones demo account.
-- These competency IDs and supporting_skills codes are referenced by
-- seed-rathbones-persona-skills to derive per-persona proficiency levels.

INSERT INTO embarksmv2.competency_catalog
  (account_id, competency_id, track_code, competency_name, short_description, supporting_skills, risk_critical, display_order)
VALUES

-- Business Knowledge
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk.strategy_culture','business_knowledge',
 'Strategy & Culture','Understanding Rathbones'' investment philosophy, house view, and firm strategy.',
 ARRAY['investment_philosophy','house_view_application','strategy_communication'],false,1),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk.operating_model','business_knowledge',
 'Operating Model','Awareness of risk, operational workflows, and internal systems.',
 ARRAY['risk_awareness','operational_workflow','internal_systems'],false,2),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk.clients_markets','business_knowledge',
 'Clients & Markets','Client segmentation, market commentary, and wealth landscape knowledge.',
 ARRAY['client_segmentation','market_commentary_authoring','wealth_landscape'],false,3),

-- Technical Knowledge
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk.client_suitability','technical_knowledge',
 'Client Suitability','KYC, attitude to risk, capacity for loss, and suitability documentation.',
 ARRAY['suitability_assessment','kyc_data_gathering','atr_capacity_for_loss'],true,4),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk.research_analysis','technical_knowledge',
 'Research & Analysis','Performance attribution, security research, and benchmark analysis.',
 ARRAY['attribution_analysis','portfolio_analytics','security_research','benchmark_selection'],false,5),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk.investment_expertise','technical_knowledge',
 'Investment Expertise','Portfolio construction, asset allocation, model portfolios, and rebalancing.',
 ARRAY['portfolio_construction','model_portfolio_application','asset_allocation','rebalancing'],false,6),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk.regulatory_risk','technical_knowledge',
 'Regulatory & Risk','Pre-trade compliance, COBS, Consumer Duty, and mandate restrictions.',
 ARRAY['pre_trade_compliance','cobs_application','consumer_duty_framework','mandate_restrictions'],true,7),

-- Behavioural Skills
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs.client_facing','behavioural_skills',
 'Client Facing','Active listening, rapport building, difficult conversations, and volatility communication.',
 ARRAY['client_rapport_building','active_listening','difficult_conversation_handling','volatility_communication'],false,8),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs.collab_leadership','behavioural_skills',
 'Collaboration & Leadership','Initiative, peer coaching, IM collaboration, and delegation.',
 ARRAY['initiative_taking','peer_coaching','im_collaboration','delegation_and_escalation'],false,9),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs.judgement_mindset','behavioural_skills',
 'Judgement & Mindset','Ethical decision-making, speak-up culture, prioritisation, and professional judgement.',
 ARRAY['ethical_decision_making','speak_up_culture','prioritisation','professional_judgement'],false,10),

-- Certification & Professional Standards
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps.cisi_l7_readiness','certification_professional_standards',
 'CISI L7 Readiness','IOC Securities and Investment Advice Diploma readiness.',
 ARRAY['cisi_ioc_securities_readiness','cisi_iad_readiness','cpd_management'],false,11),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps.regulatory_consumer_duty','certification_professional_standards',
 'Regulatory & Consumer Duty','Conduct rules, Consumer Duty, AML, and SMCR obligations.',
 ARRAY['conduct_rules_application','consumer_duty_application','aml_red_flag_detection','smcr_obligations'],true,12),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps.cpd','certification_professional_standards',
 'CPD & Professional Development','Reflective practice, CPD planning, and ongoing learning.',
 ARRAY['reflective_practice','cpd_planning','professional_development'],false,13),

-- Other Enablers
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe.systems_data_ai','other_enablers',
 'Systems, Data & AI','Charles River IMS, Bloomberg terminal, and internal systems literacy.',
 ARRAY['charles_river_navigation','bloomberg_navigation','internal_systems_literacy'],false,14),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe.mentoring_coaching','other_enablers',
 'Mentoring & Coaching','Mentor relationship, peer coaching, and feedback delivery.',
 ARRAY['mentor_relationship_setup','peer_coaching_delivery','feedback_giving'],false,15),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe.cultural_perf','other_enablers',
 'Culture & Performance','Reflective habits, onboarding engagement, and value demonstration.',
 ARRAY['reflective_practice_habit','onboarding_engagement','value_demonstration'],false,16)

ON CONFLICT (account_id, competency_id) DO NOTHING;
