-- Populate topic_outline for all catalog_assessment_blueprints (Rathbones demo).
-- useResolvedAssessment generates 2 questions per topic, capped at 5.
-- Each blueprint gets 3 topics → 5 questions after the cap.

DO $$ BEGIN

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Discretionary vs Advisory Wealth Models","weight":0.35,"linked_chapters":["bk1.c1"]},
  {"topic":"Rathbones House View and Investment Philosophy","weight":0.35,"linked_chapters":["bk1.c2"]},
  {"topic":"Conveying the Rathbones Proposition to Clients","weight":0.30,"linked_chapters":["bk1.c3","bk1.c4"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bk1.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"KYC Data Gathering and ATR Assessment","weight":0.40,"linked_chapters":["bk2.c1"]},
  {"topic":"Capacity for Loss — Evidence and Documentation","weight":0.30,"linked_chapters":["bk2.c1"]},
  {"topic":"Client Segmentation at Rathbones","weight":0.30,"linked_chapters":["bk2.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bk2.bp_mid';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"KYC, ATR and Capacity for Loss","weight":0.30,"linked_chapters":["bk2.c1"]},
  {"topic":"Client Segmentation and Service Model Selection","weight":0.30,"linked_chapters":["bk2.c2"]},
  {"topic":"Drafting a Compliant Suitability Statement","weight":0.40,"linked_chapters":["bk2.c3"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bk2.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Macro Drivers — Rates, Inflation and Growth","weight":0.35,"linked_chapters":["bk3.c1"]},
  {"topic":"Asset Class Roles in a Portfolio","weight":0.35,"linked_chapters":["bk3.c2"]},
  {"topic":"Client-Facing Market Commentary","weight":0.30,"linked_chapters":["bk3.c3"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bk3.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Strategic vs Tactical Asset Allocation","weight":0.35,"linked_chapters":["bk4.c1"]},
  {"topic":"Applying Model Portfolios to Live Client Mandates","weight":0.35,"linked_chapters":["bk4.c2"]},
  {"topic":"Rebalancing and Drift Monitoring","weight":0.30,"linked_chapters":["bk4.c3"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bk4.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"FCA Principles for Discretionary Wealth","weight":0.35,"linked_chapters":["bk5.c1"]},
  {"topic":"COBS Rules for Investment Staff","weight":0.35,"linked_chapters":["bk5.c2"]},
  {"topic":"Consumer Duty Obligations in Daily Practice","weight":0.30,"linked_chapters":["bk5.c3"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bk5.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Charles River Navigation and Key Screens","weight":0.35,"linked_chapters":["tk1.c1"]},
  {"topic":"Building and Submitting an Order Block","weight":0.35,"linked_chapters":["tk1.c2"]},
  {"topic":"Pre-Trade Compliance Checks and Alerts","weight":0.30,"linked_chapters":["tk1.c3"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk1.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Bloomberg Navigation, Tickers and Core Functions","weight":0.50,"linked_chapters":["tk2.c1"]},
  {"topic":"Researching a Single Security End-to-End","weight":0.50,"linked_chapters":["tk2.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk2.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Time-Weighted vs Money-Weighted Returns","weight":0.35,"linked_chapters":["tk3.c1"]},
  {"topic":"Brinson Attribution Decomposition","weight":0.35,"linked_chapters":["tk3.c2"]},
  {"topic":"Benchmark Selection and Defence","weight":0.30,"linked_chapters":["tk3.c3"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk3.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"ATR Score to Mandate Band Mapping","weight":0.50,"linked_chapters":["tk4.c1"]},
  {"topic":"Client Restrictions and ESG Exclusions in Charles River","weight":0.50,"linked_chapters":["tk4.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk4.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"ISA, SIPP, GIA and Trust Wrapper Selection","weight":0.50,"linked_chapters":["tk5.c1"]},
  {"topic":"Tax-Efficient Withdrawal Sequencing","weight":0.50,"linked_chapters":["tk5.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk5.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Rathbones ESG Integration and Stewardship","weight":0.50,"linked_chapters":["tk6.c1"]},
  {"topic":"ESG Client Conversations and Mandate Restrictions","weight":0.50,"linked_chapters":["tk6.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk6.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Settlement Cycles and Failed Trade Handling","weight":0.50,"linked_chapters":["tk7.c1"]},
  {"topic":"Corporate Actions in a Discretionary Book","weight":0.50,"linked_chapters":["tk7.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='tk7.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Active Listening Frameworks","weight":0.50,"linked_chapters":["bs1.c1"]},
  {"topic":"Leading a Discovery Conversation","weight":0.50,"linked_chapters":["bs1.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bs1.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Structured Approaches to Difficult Client Calls","weight":0.50,"linked_chapters":["bs2.c1"]},
  {"topic":"Delivering a Volatility Update to an Anxious Client","weight":0.50,"linked_chapters":["bs2.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bs2.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Working Effectively with Your Supervising IM","weight":0.50,"linked_chapters":["bs3.c1"]},
  {"topic":"Handover and Escalation Patterns","weight":0.50,"linked_chapters":["bs3.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bs3.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Spotting Ethical Dilemmas in IM Work","weight":0.50,"linked_chapters":["bs4.c1"]},
  {"topic":"Speaking Up and Escalating Concerns","weight":0.50,"linked_chapters":["bs4.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bs4.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Prioritising Across a Client Book","weight":0.50,"linked_chapters":["bs5.c1"]},
  {"topic":"Building and Defending a Weekly Plan","weight":0.50,"linked_chapters":["bs5.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='bs5.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"CISI IOC Study Planning and Milestones","weight":0.50,"linked_chapters":["cps1.c1"]},
  {"topic":"IOC Securities Topic Coverage Tracking","weight":0.50,"linked_chapters":["cps1.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='cps1.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Bridging from IOC to IAD — Gap Mapping","weight":1.0,"linked_chapters":["cps2.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='cps2.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Conduct Rules Applied to IM Scenarios","weight":1.0,"linked_chapters":["cps3.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='cps3.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"AML and Fraud Red Flag Identification","weight":1.0,"linked_chapters":["cps4.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='cps4.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Building a 12-Month CPD Plan for CISI","weight":1.0,"linked_chapters":["cps5.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='cps5.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Navigating Rathbones Core Internal Systems","weight":1.0,"linked_chapters":["oe1.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='oe1.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Running a Productive Mentor Conversation","weight":1.0,"linked_chapters":["oe2.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='oe2.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Structured Reflection Frameworks in Practice","weight":1.0,"linked_chapters":["oe3.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='oe3.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"IM and Wealth Planning Roles, Boundaries and Handovers","weight":0.50,"linked_chapters":["oe4.c1"]},
  {"topic":"Co-Leading a Joint Client Meeting","weight":0.50,"linked_chapters":["oe4.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='oe4.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Owning the Full Client Review Cycle","weight":1.0,"linked_chapters":["str1.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='str1.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Investment Thesis Construction","weight":0.50,"linked_chapters":["str2.c1"]},
  {"topic":"Defending a Thesis to Peers","weight":0.50,"linked_chapters":["str2.c2"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='str2.bp_post';

UPDATE embarksmv2.catalog_assessment_blueprints SET topic_outline = '[
  {"topic":"Coaching Conversations and Feedback Delivery","weight":1.0,"linked_chapters":["str3.c1"]}
]'::jsonb
WHERE account_id='6c49ca7c-fecb-4b34-a690-7e4e28bb2194' AND blueprint_code='str3.bp_post';

END $$;
