-- Seed catalog structure for the Rathbones demo account.
-- Inserts modules, chapters (empty content) and assessment blueprints so
-- reset-rathbones-demo can seed learner progress without needing OpenAI.
-- Chapter prose can be filled later via DevTools → "Backfill empty chapters".

-- ============================================================
-- catalog_modules (29 rows)
-- ============================================================
INSERT INTO embarksmv2.catalog_modules
  (account_id, module_code, module_title, domain_code, role_cohort_code,
   learning_track_code, progression_stage, module_summary,
   estimated_effort_hours, difficulty_level, prerequisite_module_codes)
VALUES

-- Business Knowledge
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk1.intro_wealth_rathbones',
 'Introduction to Wealth Management and the Rathbones Approach',
 'investment_management','assoc_im','business_knowledge',
 'associate_investment_manager_18m',
 'Covers the discretionary wealth management model, the Rathbones house view and investment philosophy, and how the firm''s proposition is conveyed to clients.',
 4,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability',
 'Client Segmentation, KYC and Suitability Foundations',
 'investment_management','assoc_im','business_knowledge',
 'associate_investment_manager_18m',
 'Builds competence in KYC, attitude to risk, capacity for loss, client segmentation, and drafting compliant suitability statements.',
 6,'foundation','{"bk1.intro_wealth_rathbones"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk3.markets_macro_assets',
 'Markets, Macro and Asset Class Fundamentals',
 'investment_management','assoc_im','business_knowledge',
 'associate_investment_manager_18m',
 'Develops macro literacy across rates, inflation and growth; maps asset class roles in portfolios; builds skills in client-facing market commentary.',
 8,'practitioner','{"bk1.intro_wealth_rathbones"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk4.portfolio_construction',
 'Portfolio Construction Principles for Associate IMs',
 'investment_management','assoc_im','business_knowledge',
 'associate_investment_manager_18m',
 'Covers strategic and tactical asset allocation, translating model portfolios to live client mandates, and rebalancing workflows.',
 7,'practitioner','{"bk3.markets_macro_assets"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk5.regulatory_landscape',
 'Regulatory Landscape — FCA, COBS and Consumer Duty Essentials',
 'investment_management','assoc_im','business_knowledge',
 'associate_investment_manager_18m',
 'Provides practical grounding in FCA principles, COBS rules for investment staff, and Consumer Duty obligations.',
 5,'foundation','{}'),

-- Technical Knowledge
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk1.charles_river_ims',
 'Charles River IMS — Order, Trade and Compliance Workflows',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Builds proficiency in navigating Charles River IMS, constructing order blocks, and resolving pre-trade compliance alerts.',
 6,'practitioner','{"bk4.portfolio_construction"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk2.bloomberg_essentials',
 'Bloomberg Terminal Essentials for IMs',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Introduces core Bloomberg terminal functions, ticker navigation, and single-security research workflow.',
 4,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk3.performance_attribution',
 'Performance Measurement, Attribution and Benchmarking',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Covers TWR/MWR calculations, Brinson attribution decomposition, and benchmark selection for client mandates.',
 5,'practitioner','{"bk4.portfolio_construction"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk4.risk_mandate_restrictions',
 'Risk Profiling, Mandate Mapping and Investment Restrictions',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Translates risk scores and capacity for loss into mandate bands and implements bespoke client restrictions.',
 5,'practitioner','{"bk2.kyc_suitability"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk5.tax_wrappers',
 'Tax-Efficient Wrappers — ISA, SIPP, GIA and Trusts',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Covers wrapper selection logic and tax-efficient withdrawal sequencing to minimise client tax drag.',
 5,'practitioner','{"bk2.kyc_suitability"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk6.esg_responsible_investing',
 'ESG Integration and Responsible Investing at Rathbones',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Articulates the firm''s ESG integration approach and builds skill in eliciting client ESG preferences.',
 4,'practitioner','{"bk1.intro_wealth_rathbones"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk7.ops_workflows',
 'Operational Workflows — Settlements, Corporate Actions, Reconciliations',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Provides awareness of T+ settlement cycles, failed trade procedures, and corporate action handling.',
 4,'foundation','{"tk1.charles_river_ims"}'),

-- Behavioural Skills
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs1.client_communication',
 'Client Communication and Active Listening',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Develops active listening techniques, client rapport-building, and explaining complex investment concepts clearly.',
 4,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs2.difficult_conversations',
 'Difficult Conversations and Managing Volatility Updates',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Equips associates with structured approaches to delivering difficult messages and managing client expectations.',
 4,'practitioner','{"bs1.client_communication"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs3.delegation_stakeholders',
 'Delegation, Stakeholder Management and Working with IMs',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Builds effective working relationships with supervising IMs and applies safe handover and escalation patterns.',
 3,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs4.judgement_ethics',
 'Professional Judgement and Ethical Decision-Making',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Builds capability to recognise ethical dilemmas and navigate conflicts of interest with confidence.',
 3,'practitioner','{"bk5.regulatory_landscape"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs5.time_prioritisation',
 'Time Management and Prioritisation in a Client Book',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Develops skills in sequencing client book work by risk and value and building realistic weekly plans.',
 3,'foundation','{}'),

-- Certification & Professional Standards
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps1.cisi_ioc_securities',
 'CISI IOC — Securities Foundations (Study Path)',
 'investment_management','assoc_im','certification_professional_standards',
 'associate_investment_manager_18m',
 'Structured study path for the CISI Investment Operations Certificate (Securities) examination.',
 30,'practitioner','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps2.cisi_iad_bridge',
 'CISI Investment Advice Diploma — Bridging Module',
 'investment_management','assoc_im','certification_professional_standards',
 'associate_investment_manager_18m',
 'Supports progression from CISI IOC to the Investment Advice Diploma through gap analysis and structured study planning.',
 12,'practitioner','{"cps1.cisi_ioc_securities"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps3.smcr_conduct',
 'SMCR and Conduct Rules for Investment Staff',
 'investment_management','assoc_im','certification_professional_standards',
 'associate_investment_manager_18m',
 'Applies Senior Managers and Certification Regime conduct rules to everyday IM scenarios.',
 3,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps4.aml_financial_crime',
 'Anti-Money Laundering and Financial Crime Prevention',
 'investment_management','assoc_im','certification_professional_standards',
 'associate_investment_manager_18m',
 'Develops ability to identify AML and fraud red flags in investment management workflows.',
 3,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps5.cpd_plan',
 'Continuing Professional Development Plan',
 'investment_management','assoc_im','certification_professional_standards',
 'associate_investment_manager_18m',
 'Guides associates in authoring a compliant 12-month CPD plan that meets CISI hour requirements.',
 2,'foundation','{}'),

-- Other Enablers
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe1.systems_tour',
 'Internal Systems Stack Tour (Rathbones-Specific)',
 'investment_management','assoc_im','other_enablers',
 'associate_investment_manager_18m',
 'Orientates new associates across Rathbones'' core internal systems.',
 3,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe2.mentor_buddy',
 'Mentor and Buddy System Onboarding',
 'investment_management','assoc_im','other_enablers',
 'associate_investment_manager_18m',
 'Establishes the mentor and buddy relationship through a structured first conversation.',
 2,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe3.reflective_practice',
 'Reflective Practice and Learning Journal Habits',
 'investment_management','assoc_im','other_enablers',
 'associate_investment_manager_18m',
 'Introduces structured reflection models and helps associates build a sustainable weekly learning journal habit.',
 2,'foundation','{}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe4.working_with_planners',
 'Working with Wealth Planners and Multi-Disciplinary Teams',
 'investment_management','assoc_im','other_enablers',
 'associate_investment_manager_18m',
 'Maps roles between IM and Wealth Planning teams and builds confidence in co-leading joint client meetings.',
 3,'foundation','{}'),

-- Stretch Modules
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str1.lead_client_review',
 'Stretch — Leading a Client Review End-to-End',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Stretch: plan, lead, and follow up a complete client review cycle independently under manager observation.',
 5,'advanced','{"bs2.difficult_conversations","tk3.performance_attribution"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str2.investment_thesis',
 'Stretch — Building and Defending an Investment Thesis',
 'investment_management','assoc_im','technical_knowledge',
 'associate_investment_manager_18m',
 'Stretch: construct a defensible single-stock or fund thesis and defend it to peers under challenge.',
 6,'advanced','{"tk2.bloomberg_essentials","tk3.performance_attribution"}'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str3.mentoring_juniors',
 'Stretch — Mentoring Junior Staff and First-Line Coaching',
 'investment_management','assoc_im','behavioural_skills',
 'associate_investment_manager_18m',
 'Stretch: develop first-line coaching and structured feedback delivery skills with junior staff.',
 3,'advanced','{"bs1.client_communication"}')

ON CONFLICT (account_id, module_code) DO NOTHING;


-- ============================================================
-- catalog_chapters (56 rows, empty content — backfill later)
-- ============================================================
INSERT INTO embarksmv2.catalog_chapters
  (account_id, module_code, chapter_code, chapter_title, display_order,
   delivery_mode, content_type, topic_tags, learning_objective)
VALUES

-- bk1
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk1.intro_wealth_rathbones','bk1.c1',
 'What is Discretionary Wealth Management?',1,'digital','reading',
 '{"wealth_models","uk_market"}',
 'Distinguish discretionary, advisory and execution-only models and place Rathbones within the UK wealth landscape.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk1.intro_wealth_rathbones','bk1.c2',
 'The Rathbones House View and Investment Philosophy',2,'digital','reading',
 '{"house_view","investment_philosophy"}',
 'Explain the firm''s investment beliefs and how the house view reaches client portfolios.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk1.intro_wealth_rathbones','bk1.c3',
 'Shadowing a Senior IM Client Review',3,'workplace_practice','shadowing_task',
 '{"client_review","house_view_in_practice"}',
 'Observe how a Senior Investment Manager translates the house view into a live client conversation.'),

-- micro-learning chapters referenced by reset-rathbones-demo
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk1.intro_wealth_rathbones','bk1.c_micro_fees',
 'Fee Structures — Quick Reference',4,'digital','reading',
 '{"fees","micro_learning"}',
 'Recall how Rathbones fee structures are explained to clients.'),

-- bk2
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability','bk2.c1',
 'KYC, ATR and Capacity for Loss',1,'digital','reading',
 '{"kyc","atr","capacity_for_loss"}',
 'Capture and interpret KYC, attitude to risk and capacity for loss to evidence suitability.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability','bk2.c2',
 'Client Segmentation at Rathbones',2,'digital','reading',
 '{"segmentation","service_levels"}',
 'Segment clients by needs, complexity and value and select the right service model.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability','bk2.c3',
 'Drafting a Suitability Statement',3,'workplace_practice','workplace_assignment',
 '{"suitability_letter"}',
 'Produce a compliant suitability statement linking client facts to portfolio recommendation.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability','bk2.c_micro_vuln',
 'Vulnerable Clients — Quick Reference',4,'digital','reading',
 '{"vulnerable_clients","consumer_duty","micro_learning"}',
 'Identify vulnerability flags and apply the Consumer Duty outcomes framework.'),

-- bk3
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk3.markets_macro_assets','bk3.c1',
 'Macro Drivers — Rates, Inflation, Growth',1,'digital','reading',
 '{"macro","rates","inflation"}',
 'Explain how core macro variables transmit to asset prices.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk3.markets_macro_assets','bk3.c2',
 'Equities, Fixed Income, Alternatives — Roles in a Portfolio',2,'digital','reading',
 '{"equities","fixed_income","alternatives"}',
 'Map asset class characteristics to client objectives and risk profiles.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk3.markets_macro_assets','bk3.c3',
 'Writing a Weekly Market Note',3,'workplace_practice','workplace_assignment',
 '{"market_commentary"}',
 'Produce a 250-word client-facing market commentary in Rathbones tone.'),

-- bk4
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk4.portfolio_construction','bk4.c1',
 'Strategic vs Tactical Asset Allocation',1,'digital','reading',
 '{"saa","taa"}',
 'Differentiate SAA and TAA and describe Rathbones'' framework.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk4.portfolio_construction','bk4.c2',
 'Applying Model Portfolios to Live Clients',2,'digital','reading',
 '{"model_portfolios","legacy_holdings"}',
 'Translate a model portfolio to a real client mandate, accounting for legacy holdings and tax.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk4.portfolio_construction','bk4.c3',
 'Rebalancing and Drift Monitoring',3,'simulation','simulation',
 '{"rebalancing","drift"}',
 'Identify drift breaches and propose rebalancing trades within mandate constraints.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk4.portfolio_construction','bk4.c_micro_rebalance',
 'Rebalancing Rules — Quick Reference',4,'digital','reading',
 '{"rebalancing","drift","micro_learning"}',
 'Apply Rathbones'' drift thresholds to identify when rebalancing is triggered.'),

-- bk5
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk5.regulatory_landscape','bk5.c1',
 'FCA Principles for Businesses in Practice',1,'digital','reading',
 '{"fca_principles"}',
 'Explain the FCA principles most relevant to discretionary wealth.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk5.regulatory_landscape','bk5.c2',
 'COBS Highlights for Investment Staff',2,'digital','reading',
 '{"cobs"}',
 'Apply key COBS rules around suitability, communications and conflicts.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk5.regulatory_landscape','bk5.c3',
 'Consumer Duty in Daily Practice',3,'digital','reading',
 '{"consumer_duty"}',
 'Identify Consumer Duty obligations across the four outcomes for IM activity.'),

-- tk1
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk1.charles_river_ims','tk1.c1',
 'Charles River Navigation and Key Screens',1,'simulation','system_practice',
 '{"charles_river","navigation"}',
 'Navigate Charles River screens for portfolios, orders and compliance.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk1.charles_river_ims','tk1.c2',
 'Building and Submitting an Order Block',2,'simulation','system_practice',
 '{"order_block","execution"}',
 'Construct an order block with correct sizing, account and venue selection.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk1.charles_river_ims','tk1.c3',
 'Pre-Trade Compliance Checks and Alerts',3,'simulation','system_practice',
 '{"pre_trade_compliance","alerts"}',
 'Interpret compliance alerts and resolve them within policy.'),

-- tk2
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk2.bloomberg_essentials','tk2.c1',
 'Navigation, Tickers and Functions',1,'digital','reading',
 '{"bloomberg","functions"}',
 'Use core Bloomberg functions (DES, GP, FA, RV) confidently.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk2.bloomberg_essentials','tk2.c2',
 'Researching a Single Security End-to-End',2,'workplace_practice','workplace_assignment',
 '{"security_research"}',
 'Build a one-page research note from Bloomberg data on one security.'),

-- tk3
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk3.performance_attribution','tk3.c1',
 'TWR vs MWR and Why It Matters',1,'digital','reading',
 '{"twr","mwr"}',
 'Compute and interpret time- and money-weighted returns.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk3.performance_attribution','tk3.c2',
 'Brinson Attribution Walkthrough',2,'digital','reading',
 '{"attribution","brinson"}',
 'Decompose excess return into allocation and selection effects.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk3.performance_attribution','tk3.c3',
 'Choosing and Defending a Benchmark',3,'digital','reading',
 '{"benchmark"}',
 'Select an appropriate benchmark for a client mandate and defend the choice.'),

-- tk4
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk4.risk_mandate_restrictions','tk4.c1',
 'From ATR Score to Mandate Selection',1,'digital','reading',
 '{"risk_profiling","mandate"}',
 'Translate a risk score and CFL into a mandate band.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk4.risk_mandate_restrictions','tk4.c2',
 'Handling Client Restrictions and ESG Exclusions',2,'simulation','system_practice',
 '{"restrictions","esg_exclusions"}',
 'Implement bespoke restrictions and reflect them in Charles River.'),

-- tk5
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk5.tax_wrappers','tk5.c1',
 'Wrapper Map — When to Use Which',1,'digital','reading',
 '{"wrappers","isa","sipp"}',
 'Choose between ISA, SIPP, GIA and Trust based on client circumstances.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk5.tax_wrappers','tk5.c2',
 'Tax-Efficient Withdrawal Sequencing',2,'digital','reading',
 '{"withdrawals","tax_drag"}',
 'Sequence withdrawals across wrappers to minimise tax drag.'),

-- tk6
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk6.esg_responsible_investing','tk6.c1',
 'Rathbones'' Approach to Responsible Investing',1,'digital','reading',
 '{"esg","stewardship"}',
 'Articulate the firm''s ESG integration approach and stewardship model.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk6.esg_responsible_investing','tk6.c2',
 'Handling Client Conversations on ESG',2,'simulation','client_scenario',
 '{"client_dialogue","esg"}',
 'Lead a conversation about ESG preferences and translate them into mandate restrictions.'),

-- tk7
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk7.ops_workflows','tk7.c1',
 'Settlement Cycles and Failed Trades',1,'digital','reading',
 '{"settlement"}',
 'Explain T+ cycles and what to do when a trade fails.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk7.ops_workflows','tk7.c2',
 'Corporate Actions in a Discretionary Book',2,'digital','reading',
 '{"corporate_actions"}',
 'Handle voluntary and mandatory corporate actions correctly.'),

-- bs1
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs1.client_communication','bs1.c1',
 'Active Listening Frameworks',1,'digital','reading',
 '{"active_listening"}',
 'Apply active listening techniques in client conversations.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs1.client_communication','bs1.c2',
 'Practice — Discovery Conversation',2,'simulation','client_scenario',
 '{"discovery_call"}',
 'Lead a 10-minute discovery conversation with a synthetic client.'),

-- bs2
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs2.difficult_conversations','bs2.c1',
 'Frameworks for Difficult Client Calls',1,'digital','reading',
 '{"difficult_conversations"}',
 'Apply a structured approach to delivering hard messages.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs2.difficult_conversations','bs2.c2',
 'Volatility Update — Live Practice',2,'simulation','client_scenario',
 '{"volatility_update"}',
 'Deliver a volatility update to an anxious client and manage objections.'),

-- bs3
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs3.delegation_stakeholders','bs3.c1',
 'Working Effectively with Your IM',1,'coaching','coaching_discussion',
 '{"im_collaboration"}',
 'Set expectations and feedback loops with the supervising IM.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs3.delegation_stakeholders','bs3.c2',
 'Handover and Escalation Patterns',2,'digital','reading',
 '{"handover","escalation"}',
 'Use handover and escalation patterns to keep work safe.'),

-- bs4
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs4.judgement_ethics','bs4.c1',
 'Spotting Ethical Dilemmas',1,'digital','reading',
 '{"ethics"}',
 'Recognise common ethical traps in IM work.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs4.judgement_ethics','bs4.c2',
 'Speaking Up and Escalating Concerns',2,'digital','reading',
 '{"speak_up","escalation"}',
 'Use the firm''s escalation channels with confidence.'),

-- bs5
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs5.time_prioritisation','bs5.c1',
 'Prioritising Across a Client Book',1,'digital','reading',
 '{"prioritisation"}',
 'Sequence work across a client book using risk and value.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs5.time_prioritisation','bs5.c2',
 'Building a Weekly Plan',2,'coaching','coaching_discussion',
 '{"weekly_plan"}',
 'Build and defend a realistic weekly plan with mentor.'),

-- cps1
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps1.cisi_ioc_securities','cps1.c1',
 'CISI IOC Study Plan and Milestones',1,'digital','reading',
 '{"cisi","study_plan"}',
 'Build and commit to a 12-week CISI study plan.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps1.cisi_ioc_securities','cps1.c2',
 'Topic Coverage Tracker — IOC Securities',2,'workplace_practice','observed_practice',
 '{"cisi_tracker"}',
 'Track CISI topic coverage and self-test results.'),

-- cps2
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps2.cisi_iad_bridge','cps2.c1',
 'From IOC to IAD — Gap Map',1,'digital','reading',
 '{"iad","gap_map"}',
 'Identify the gap between IOC and IAD and plan study.'),

-- cps3
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps3.smcr_conduct','cps3.c1',
 'Conduct Rules in Daily Practice',1,'digital','reading',
 '{"smcr","conduct_rules"}',
 'Apply each Conduct Rule to common IM scenarios.'),

-- cps4
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps4.aml_financial_crime','cps4.c1',
 'Spotting Red Flags',1,'digital','reading',
 '{"aml","red_flags"}',
 'Identify common AML and fraud red flags in IM workflows.'),

-- cps5
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps5.cpd_plan','cps5.c1',
 'Building a 12-Month CPD Plan',1,'digital','reading',
 '{"cpd"}',
 'Author a CPD plan that meets CISI hour requirements.'),

-- oe1
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe1.systems_tour','oe1.c1',
 'End-to-End Systems Tour',1,'digital','reading',
 '{"systems"}',
 'Navigate Rathbones'' core internal systems.'),

-- oe2
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe2.mentor_buddy','oe2.c1',
 'First Mentor Conversation',1,'coaching','mentor_discussion',
 '{"mentor"}',
 'Run a productive first mentor conversation and set goals.'),

-- oe3
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe3.reflective_practice','oe3.c1',
 'Reflection Frameworks That Work',1,'digital','reading',
 '{"reflection"}',
 'Use a structured reflection model weekly.'),

-- oe4
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe4.working_with_planners','oe4.c1',
 'Roles, Boundaries and Handovers',1,'digital','reading',
 '{"mdt","handover"}',
 'Map roles between IM and Wealth Planning teams.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe4.working_with_planners','oe4.c2',
 'Joint Client Meeting Practice',2,'workplace_practice','observed_practice',
 '{"joint_meeting"}',
 'Co-lead a joint client meeting with a Wealth Planner.'),

-- str1
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str1.lead_client_review','str1.c1',
 'Owning the Full Review Cycle',1,'workplace_practice','observed_practice',
 '{"client_review_lead"}',
 'Plan, lead and follow up a complete client review.'),

-- str2
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str2.investment_thesis','str2.c1',
 'Thesis Construction Methodology',1,'digital','reading',
 '{"thesis","research"}',
 'Construct a defensible single-stock or fund thesis.'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str2.investment_thesis','str2.c2',
 'Defending the Thesis to Peers',2,'live_cohort','peer_discussion',
 '{"thesis_defence"}',
 'Present and defend a thesis to a peer group with challenge.'),

-- str3
('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str3.mentoring_juniors','str3.c1',
 'Coaching Conversations Practice',1,'workplace_practice','observed_practice',
 '{"coaching","feedback"}',
 'Run a coaching conversation with a junior peer.')

ON CONFLICT (account_id, chapter_code) DO NOTHING;


-- ============================================================
-- catalog_assessment_blueprints (30 rows)
-- ============================================================
INSERT INTO embarksmv2.catalog_assessment_blueprints
  (account_id, module_code, blueprint_code, scope, assessment_type,
   assessment_title, passing_score, chapter_code)
VALUES

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk1.intro_wealth_rathbones','bk1.bp_post',
 'module_post','applied_client_scenario',
 'BK1 — Wealth Management Foundations Check',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability','bk2.bp_mid',
 'milestone','diagnostic_knowledge_check',
 'BK2 — KYC & Suitability Milestone',80,'bk2.c1'),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk2.kyc_suitability','bk2.bp_post',
 'module_post','suitability_review',
 'BK2 — Suitability Case Analysis',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk3.markets_macro_assets','bk3.bp_post',
 'module_post','investment_research_case',
 'BK3 — Markets & Macro Written Assessment',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk4.portfolio_construction','bk4.bp_post',
 'module_post','portfolio_construction_case',
 'BK4 — Portfolio Construction Task',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bk5.regulatory_landscape','bk5.bp_post',
 'module_post','regulatory_knowledge_check',
 'BK5 — Regulatory Compliance Review',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk1.charles_river_ims','tk1.bp_post',
 'module_post','system_workflow_completion',
 'TK1 — Charles River System Task',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk2.bloomberg_essentials','tk2.bp_post',
 'module_post','system_workflow_completion',
 'TK2 — Bloomberg Terminal Task',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk3.performance_attribution','tk3.bp_post',
 'module_post','investment_research_case',
 'TK3 — Performance Attribution Calculation',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk4.risk_mandate_restrictions','tk4.bp_post',
 'module_post','suitability_review',
 'TK4 — Risk & Mandate Case Analysis',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk5.tax_wrappers','tk5.bp_post',
 'module_post','applied_client_scenario',
 'TK5 — Tax Wrapper Scenario',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk6.esg_responsible_investing','tk6.bp_post',
 'module_post','client_conversation_simulation',
 'TK6 — ESG Client Conversation',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','tk7.ops_workflows','tk7.bp_post',
 'module_post','diagnostic_knowledge_check',
 'TK7 — Operations Knowledge Check',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs1.client_communication','bs1.bp_post',
 'module_post','client_conversation_simulation',
 'BS1 — Discovery Conversation Assessment',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs2.difficult_conversations','bs2.bp_post',
 'module_post','client_conversation_simulation',
 'BS2 — Difficult Conversation Simulation',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs3.delegation_stakeholders','bs3.bp_post',
 'module_post','cpd_reflection',
 'BS3 — Stakeholder Reflective Journal',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs4.judgement_ethics','bs4.bp_post',
 'module_post','ethical_dilemma',
 'BS4 — Ethical Dilemma Scenario',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','bs5.time_prioritisation','bs5.bp_post',
 'module_post','cpd_reflection',
 'BS5 — Prioritisation Reflective Journal',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps1.cisi_ioc_securities','cps1.bp_post',
 'module_post','system_workflow_completion',
 'CPS1 — CISI IOC Study Completion',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps2.cisi_iad_bridge','cps2.bp_post',
 'module_post','cpd_reflection',
 'CPS2 — IAD Bridge Reflection',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps3.smcr_conduct','cps3.bp_post',
 'module_post','regulatory_knowledge_check',
 'CPS3 — SMCR Conduct Knowledge Check',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps4.aml_financial_crime','cps4.bp_post',
 'module_post','applied_client_scenario',
 'CPS4 — AML Red Flags Scenario',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','cps5.cpd_plan','cps5.bp_post',
 'module_post','cpd_reflection',
 'CPS5 — CPD Plan Review',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe1.systems_tour','oe1.bp_post',
 'module_post','diagnostic_knowledge_check',
 'OE1 — Systems Tour Knowledge Check',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe2.mentor_buddy','oe2.bp_post',
 'module_post','mentor_review',
 'OE2 — Mentor Sign-Off',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe3.reflective_practice','oe3.bp_post',
 'module_post','cpd_reflection',
 'OE3 — Reflective Practice Journal',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','oe4.working_with_planners','oe4.bp_post',
 'module_post','observed_client_meeting',
 'OE4 — Joint Meeting Observation',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str1.lead_client_review','str1.bp_post',
 'module_post','observed_client_meeting',
 'STR1 — Client Review Manager Observation',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str2.investment_thesis','str2.bp_post',
 'module_post','assessor_review',
 'STR2 — Investment Thesis Presentation',80,NULL),

('6c49ca7c-fecb-4b34-a690-7e4e28bb2194','str3.mentoring_juniors','str3.bp_post',
 'module_post','assessor_review',
 'STR3 — Coaching Peer Review',80,NULL)

ON CONFLICT (account_id, blueprint_code) DO NOTHING;
