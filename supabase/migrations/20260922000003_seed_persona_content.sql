-- Seed persona content for all 9 Rathbones learner personas.
-- Populates: employee_personas, employee_persona_assignments,
--   persona_profile_basics, persona_career_here, persona_aspiration,
--   persona_succession_notes, persona_manager_feedback,
--   persona_stretch_tasks, persona_potential_roles.
-- Data is mirrored to Pinnacle Capital via the mirror edge function after running.

DO $$
DECLARE
  rb uuid := '6c49ca7c-fecb-4b34-a690-7e4e28bb2194';
BEGIN

-- ─────────────────────────────────────────────────────────────────
-- 1. employee_personas  (persona catalogue rows)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.employee_personas (account_id, code, name, description, default_role_progression_code)
VALUES
  (rb,'rb_l1','Sophie Linden','Early-career AIM — strong academic background, building client-facing skills.','assoc_im'),
  (rb,'rb_l2','Maya Holloway','Mid-career AIM — prior private-banking experience, confident with HNW clients.','assoc_im'),
  (rb,'rb_l3','Theo Marchant','Rising-star AIM — fast learner, technically strong, working towards IM.','assoc_im'),
  (rb,'rb_l4','Owen Castell','Solid AIM — process-oriented, excels in compliance and risk.','assoc_im'),
  (rb,'rb_l5','Priya Aldridge','Experienced AIM — ESG specialist, strong research and attribution skills.','assoc_im'),
  (rb,'rb_l6','Clara Wren','Mid-career AIM — strong technical foundations from buy-side; targeting full client-book ownership.','assoc_im'),
  (rb,'rb_l7','Rosa Belmont','New joiner AIM — recent CISI IOC pass, building core investment knowledge.','assoc_im'),
  (rb,'rb_l8','Felix Arden','Senior AIM — leading client reviews, mentoring juniors, on promotion track.','assoc_im'),
  (rb,'rb_l9','Elliot Hayes','Developing AIM — needs support on regulatory topics, strong in client communication.','assoc_im')
ON CONFLICT (account_id, code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 2. employee_persona_assignments
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.employee_persona_assignments (account_id, employee_id, persona_code, role_progression_code)
VALUES
  (rb,'rb-l1','rb_l1','assoc_im'),
  (rb,'rb-l2','rb_l2','assoc_im'),
  (rb,'rb-l3','rb_l3','assoc_im'),
  (rb,'rb-l4','rb_l4','assoc_im'),
  (rb,'rb-l5','rb_l5','assoc_im'),
  (rb,'rb-l6','rb_l6','assoc_im'),
  (rb,'rb-l7','rb_l7','assoc_im'),
  (rb,'rb-l8','rb_l8','assoc_im'),
  (rb,'rb-l9','rb_l9','assoc_im')
ON CONFLICT (account_id, employee_id, persona_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 3. persona_profile_basics
--    data JSONB: location, office, work_pattern, languages,
--    manager_label, prior_employer, prior_industry, years_experience,
--    education, certifications,
--    + hris fields: tenure_months, performance_band, engagement_score,
--      persona_narrative
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_profile_basics (account_id, persona_code, data) VALUES

(rb,'rb_l1','{
  "location":"London, UK","office":"Port of Liverpool Building","work_pattern":"Hybrid — 3 days in office",
  "languages":["English"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Graduate trainee · Barclays Wealth","prior_industry":"Retail Banking",
  "years_experience":2,"education":["BA Economics, University of Exeter"],
  "certifications":[{"name":"CISI IOC","status":"held"}],
  "tenure_months":22,"performance_band":"Developing","engagement_score":74,
  "persona_narrative":"Early-career AIM building confidence in client-facing situations; strong analytics foundation."
}'::jsonb),

(rb,'rb_l2','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Hybrid — 3 days in office",
  "languages":["English","Spanish"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Relationship manager · Coutts","prior_industry":"Private Banking",
  "years_experience":6,"education":["BSc Finance, University of Bath"],
  "certifications":[{"name":"CISI IAD","status":"held"},{"name":"IMC","status":"held"}],
  "tenure_months":36,"performance_band":"Strong","engagement_score":80,
  "persona_narrative":"Confident with HNW clients; deepening investment-construction skills to complement client-service strengths."
}'::jsonb),

(rb,'rb_l3','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Hybrid — 4 days in office",
  "languages":["English"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Analyst · Artemis Fund Managers","prior_industry":"Asset Management",
  "years_experience":3,"education":["MEng Engineering, Imperial College London"],
  "certifications":[{"name":"CFA Level I","status":"held"},{"name":"CFA Level II","status":"in_progress"}],
  "tenure_months":28,"performance_band":"Exceptional","engagement_score":88,
  "persona_narrative":"Fast-moving technical talent; strongest quantitative skills in the cohort, targeting early IM promotion."
}'::jsonb),

(rb,'rb_l4','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Hybrid — 3 days in office",
  "languages":["English","German"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Compliance analyst · Aviva Investors","prior_industry":"Asset Management",
  "years_experience":4,"education":["LLB Law, University of Bristol"],
  "certifications":[{"name":"CISI IAD","status":"held"}],
  "tenure_months":30,"performance_band":"Good","engagement_score":71,
  "persona_narrative":"Process-oriented and reliable; deep compliance knowledge, building portfolio-construction confidence."
}'::jsonb),

(rb,'rb_l5','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Hybrid — 3 days in office",
  "languages":["English","Hindi"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"ESG research analyst · Schroders","prior_industry":"Asset Management",
  "years_experience":5,"education":["MSc Sustainable Finance, Edinburgh University"],
  "certifications":[{"name":"CFA Level II","status":"held"},{"name":"CFA Level III","status":"in_progress"}],
  "tenure_months":32,"performance_band":"Strong","engagement_score":82,
  "persona_narrative":"ESG specialist integrating sustainability factors into client portfolios; strong attribution and research skills."
}'::jsonb),

(rb,'rb_l6','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Hybrid — 3 days in office",
  "languages":["English","French"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Equity research analyst · UK mid-cap fund","prior_industry":"Investment Management",
  "years_experience":5,"education":["BSc Economics, University of Bristol"],
  "certifications":[{"name":"CFA Level II","status":"held"},{"name":"CISI IAD","status":"in_progress"}],
  "tenure_months":50,"performance_band":"Strong","engagement_score":82,
  "persona_narrative":"Mid-career Associate IM with strong technical foundations from a prior buy-side role. Working towards full client-book ownership; needs Rathbones-specific validation on ESG, attribution and Consumer Duty."
}'::jsonb),

(rb,'rb_l7','{
  "location":"London, UK","office":"Liverpool Office","work_pattern":"Hybrid — 2 days in office",
  "languages":["English"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Junior analyst · St. James''s Place","prior_industry":"Wealth Management",
  "years_experience":1,"education":["BA History, University of Edinburgh"],
  "certifications":[{"name":"CISI IOC","status":"held"}],
  "tenure_months":10,"performance_band":"Developing","engagement_score":68,
  "persona_narrative":"New joiner building foundational investment knowledge; eager learner with strong interpersonal skills."
}'::jsonb),

(rb,'rb_l8','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Hybrid — 4 days in office",
  "languages":["English"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Investment manager · Cazenove Capital","prior_industry":"Investment Management",
  "years_experience":8,"education":["BSc Finance & Accounting, Nottingham University"],
  "certifications":[{"name":"CISI IAD","status":"held"},{"name":"IMC","status":"held"},{"name":"CFA Level III","status":"held"}],
  "tenure_months":60,"performance_band":"Exceptional","engagement_score":91,
  "persona_narrative":"Senior AIM leading client reviews independently and actively mentoring three junior team members; on track for IM promotion."
}'::jsonb),

(rb,'rb_l9','{
  "location":"London, UK","office":"30 Gresham St","work_pattern":"Office — 5 days",
  "languages":["English","Mandarin"],"manager_label":"Reports into Head of Investment Team",
  "prior_employer":"Operations analyst · HSBC Private Bank","prior_industry":"Banking",
  "years_experience":3,"education":["BEng Computer Science, University of Manchester"],
  "certifications":[{"name":"CISI IOC","status":"held"},{"name":"CISI IAD","status":"in_progress"}],
  "tenure_months":18,"performance_band":"Good","engagement_score":73,
  "persona_narrative":"Strong operational and systems background; developing investment expertise and regulatory knowledge for the IM pathway."
}'::jsonb)

ON CONFLICT (account_id, persona_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 4. persona_career_here
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_career_here (account_id, persona_code, data) VALUES
(rb,'rb_l1','{"current_role":"Associate Investment Manager","team":"UK Equities","tenure_label":"1y 10m"}'::jsonb),
(rb,'rb_l2','{"current_role":"Associate Investment Manager","team":"Multi-Asset","tenure_label":"3y 0m"}'::jsonb),
(rb,'rb_l3','{"current_role":"Associate Investment Manager","team":"UK Equities","tenure_label":"2y 4m"}'::jsonb),
(rb,'rb_l4','{"current_role":"Associate Investment Manager","team":"Fixed Income","tenure_label":"2y 6m"}'::jsonb),
(rb,'rb_l5','{"current_role":"Associate Investment Manager","team":"Sustainable Investing","tenure_label":"2y 8m"}'::jsonb),
(rb,'rb_l6','{"current_role":"Investment Manager","team":"UK Equities","tenure_label":"4y 2m"}'::jsonb),
(rb,'rb_l7','{"current_role":"Associate Investment Manager","team":"Multi-Asset","tenure_label":"0y 10m"}'::jsonb),
(rb,'rb_l8','{"current_role":"Senior Associate Investment Manager","team":"UK Equities","tenure_label":"5y 0m"}'::jsonb),
(rb,'rb_l9','{"current_role":"Associate Investment Manager","team":"Fixed Income","tenure_label":"1y 6m"}'::jsonb)
ON CONFLICT (account_id, persona_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 5. persona_aspiration
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_aspiration (account_id, persona_code, data) VALUES
(rb,'rb_l1','{"north_star":"Build a client book focused on sustainable wealth strategies.","next_move":"Investment Manager","horizon_months":24}'::jsonb),
(rb,'rb_l2','{"north_star":"Lead a team of IMs and grow the firm''s HNW client segment.","next_move":"Investment Manager","horizon_months":18}'::jsonb),
(rb,'rb_l3','{"north_star":"Become a lead IM managing a significant discretionary book within three years.","next_move":"Investment Manager","horizon_months":12}'::jsonb),
(rb,'rb_l4','{"north_star":"Specialise in risk-adjusted portfolio management and contribute to compliance best practice.","next_move":"Investment Manager","horizon_months":24}'::jsonb),
(rb,'rb_l5','{"north_star":"Establish Rathbones'' ESG capability and influence investment policy.","next_move":"Senior Investment Manager","horizon_months":18}'::jsonb),
(rb,'rb_l6','{"north_star":"Take primary ownership of a private-client book and mentor juniors.","next_move":"Senior Investment Manager","horizon_months":18}'::jsonb),
(rb,'rb_l7','{"north_star":"Develop into a well-rounded IM and build lasting client relationships.","next_move":"Investment Manager","horizon_months":30}'::jsonb),
(rb,'rb_l8','{"north_star":"Become a senior IM and eventually take on a team leadership role.","next_move":"Investment Manager","horizon_months":6}'::jsonb),
(rb,'rb_l9','{"north_star":"Combine systems and investment expertise to drive operational excellence in portfolio management.","next_move":"Investment Manager","horizon_months":24}'::jsonb)
ON CONFLICT (account_id, persona_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 6. persona_succession_notes
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_succession_notes (account_id, persona_code, data) VALUES
(rb,'rb_l1','{"engagement_score":74,"human_ai_fit":"Developing","pulse_trend":"Improving","closed_loop_summary":"Building foundational skills; client-outcomes contribution expected to grow as competencies are validated.","workforce_of_the_future":"Develop sustainable-investment specialism to support Rathbones ESG mandate."}'::jsonb),
(rb,'rb_l2','{"engagement_score":80,"human_ai_fit":"High","pulse_trend":"Stable","closed_loop_summary":"Client retention improving; strong relationship skills translating into measurable outcomes.","workforce_of_the_future":"HNW client growth and multi-asset capability supports firm''s strategic priorities."}'::jsonb),
(rb,'rb_l3','{"engagement_score":88,"human_ai_fit":"High","pulse_trend":"Rising","closed_loop_summary":"Exceptional progression; already leading client reviews ahead of role expectation.","workforce_of_the_future":"Strengthen AI-augmented research + private-markets coverage."}'::jsonb),
(rb,'rb_l4','{"engagement_score":71,"human_ai_fit":"Medium","pulse_trend":"Stable","closed_loop_summary":"Reliable contribution on compliance-heavy portfolios; developing portfolio-construction skills.","workforce_of_the_future":"Embed risk-governance expertise into next-generation compliance workflows."}'::jsonb),
(rb,'rb_l5','{"engagement_score":82,"human_ai_fit":"High","pulse_trend":"Stable","closed_loop_summary":"ESG-focused client outcomes consistently strong; CFA Level III on track.","workforce_of_the_future":"Lead ESG integration across discretionary mandates as regulatory pressure grows."}'::jsonb),
(rb,'rb_l6','{"engagement_score":78,"human_ai_fit":"High","pulse_trend":"Stable","closed_loop_summary":"Skills validated translate into client outcomes (NPS, retention, pitch win-rate).","workforce_of_the_future":"Strengthen AI-augmented research + private-markets coverage."}'::jsonb),
(rb,'rb_l7','{"engagement_score":68,"human_ai_fit":"Developing","pulse_trend":"Improving","closed_loop_summary":"Early days; strong engagement with learning programme and positive client feedback from initial interactions.","workforce_of_the_future":"Build digital-native investment practice for next generation of clients."}'::jsonb),
(rb,'rb_l8','{"engagement_score":91,"human_ai_fit":"High","pulse_trend":"Rising","closed_loop_summary":"Highest client-satisfaction scores in cohort; mentoring contribution recognised by team.","workforce_of_the_future":"Ready for team-leadership responsibilities alongside IM promotion."}'::jsonb),
(rb,'rb_l9','{"engagement_score":73,"human_ai_fit":"Medium","pulse_trend":"Stable","closed_loop_summary":"Systems expertise adding operational value; investment skills developing on track.","workforce_of_the_future":"Bridge investment and technology capabilities to drive portfolio-management innovation."}'::jsonb)
ON CONFLICT (account_id, persona_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 7. persona_potential_roles
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_potential_roles (account_id, persona_code, role_title, fit_percent, horizon_months, rationale, display_order) VALUES
(rb,'rb_l1','Investment Manager',55,24,'Building required competencies on track; client-facing skills developing well.',1),
(rb,'rb_l1','ESG Specialist IM',65,30,'Strong interest and academic background in sustainable investment.',2),

(rb,'rb_l2','Investment Manager',72,18,'Relationship skills above bar; technical construction skills closing fast.',1),
(rb,'rb_l2','Senior Associate IM',80,12,'Ready for broader client ownership with current trajectory.',2),

(rb,'rb_l3','Investment Manager',85,12,'Exceptional technical progression; on track for early promotion.',1),
(rb,'rb_l3','Portfolio Manager (equities)',60,24,'CFA Level II completion would accelerate this pathway.',2),

(rb,'rb_l4','Investment Manager',64,24,'Strong compliance foundation; portfolio-construction gap being addressed.',1),
(rb,'rb_l4','Risk & Compliance Specialist',75,18,'Natural fit given regulatory expertise.',2),

(rb,'rb_l5','Senior Investment Manager',70,18,'ESG expertise and CFA Level III position for senior role.',1),
(rb,'rb_l5','Investment Manager',82,12,'Current competency profile already at IM level in most areas.',2),

(rb,'rb_l6','Senior Investment Manager',78,12,'Client retention + pitch wins clear the bar; one stretch mandate pending.',1),
(rb,'rb_l6','Portfolio Manager (equities)',64,24,'Equity research background aligns; needs two more years of book ownership.',2),

(rb,'rb_l7','Investment Manager',40,30,'Solid start; needs 18 months of structured development before IM readiness.',1),
(rb,'rb_l7','Client Relationship Manager',60,18,'Strong interpersonal skills; viable alternative pathway.',2),

(rb,'rb_l8','Investment Manager',93,6,'Already performing at IM level; promotion paperwork in progress.',1),
(rb,'rb_l8','Senior Investment Manager',65,18,'Strong track record; team-leadership experience needed.',2),

(rb,'rb_l9','Investment Manager',58,24,'Developing investment competencies well; regulatory gap being closed.',1),
(rb,'rb_l9','Operations & Technology Lead',70,18,'Unique systems background creates differentiated career path.',2);

-- ─────────────────────────────────────────────────────────────────
-- 8. persona_stretch_tasks
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_stretch_tasks (account_id, persona_code, title, detail, status, display_order) VALUES
(rb,'rb_l1','Run a client discovery call independently','Supported by manager review; focus on KYC data gathering.','in_progress',1),
(rb,'rb_l1','Produce a model portfolio review report','Using Rathbones house view; to be reviewed by Julian.','not_started',2),

(rb,'rb_l2','Lead a mid-year portfolio review for one client','End-to-end ownership from prep to debrief.','in_progress',1),
(rb,'rb_l2','Complete CFA Level II mock paper','Target 70%+ before exam date.','in_progress',2),

(rb,'rb_l3','Present attribution analysis to the investment committee','10-minute slot at next monthly IC meeting.','in_progress',1),
(rb,'rb_l3','Shadow a new-client pitch end-to-end','Observe and contribute to proposal stage.','completed',2),

(rb,'rb_l4','Lead a pre-trade compliance review cycle','Document findings and recommendations.','in_progress',1),
(rb,'rb_l4','Prepare a suitability case study for the team','Based on a real anonymised client scenario.','not_started',2),

(rb,'rb_l5','Produce ESG integration report for one client mandate','Publish as internal best-practice example.','in_progress',1),
(rb,'rb_l5','Deliver a team lunch-and-learn on Consumer Duty','30-minute session with Q&A.','completed',2),

(rb,'rb_l6','Lead one new-client pitch end-to-end','From discovery → proposal → committee.','in_progress',1),
(rb,'rb_l6','Mentor one early-career analyst','Weekly 30-min check-ins.','in_progress',2),

(rb,'rb_l7','Complete first unsupported client meeting notes','Submit to manager within 24 hours of meeting.','not_started',1),
(rb,'rb_l7','Attend three client reviews as observer','Note client communication techniques.','in_progress',2),

(rb,'rb_l8','Lead a knowledge-sharing session on portfolio attribution','For the full AIM cohort.','completed',1),
(rb,'rb_l8','Develop an onboarding buddy plan for new joiners','Propose structured 90-day buddy framework.','in_progress',2),

(rb,'rb_l9','Map all regulatory touchpoints in the order workflow','Produce a one-page reference guide.','in_progress',1),
(rb,'rb_l9','Participate in a client volatility communication call','With Julian''s oversight.','not_started',2);

-- ─────────────────────────────────────────────────────────────────
-- 9. persona_manager_feedback
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_manager_feedback (account_id, persona_code, feedback_at, author_label, sentiment, body, display_order) VALUES
(rb,'rb_l1','2026-08-15','Julian Wexford · Investment Director','positive','Sophie is making good progress on her foundational modules. Her analytical work on the mock portfolio review was thorough. Next step is building confidence in client-facing scenarios.',1),
(rb,'rb_l1','2026-06-20','Julian Wexford · Investment Director','constructive','Need to spend more time on KYC documentation protocols before taking unsupported client calls.',2),

(rb,'rb_l2','2026-09-01','Julian Wexford · Investment Director','positive','Maya handled the Henderson portfolio review with real maturity — client feedback was excellent. Attribution module now the only gap before IM readiness conversation.',1),
(rb,'rb_l2','2026-07-10','Julian Wexford · Investment Director','positive','Strong mid-year performance. CFA Level II preparation is on track.',2),

(rb,'rb_l3','2026-09-10','Julian Wexford · Investment Director','positive','Theo continues to impress. His Brinson attribution analysis was the best in the cohort. We''re tracking for an early promotion conversation in Q1 2027.',1),
(rb,'rb_l3','2026-07-05','Julian Wexford · Investment Director','positive','Outstanding IC presentation — asked insightful questions and clearly had done independent research.',2),

(rb,'rb_l4','2026-08-20','Julian Wexford · Investment Director','constructive','Owen''s compliance knowledge is excellent but he needs to apply it more proactively in portfolio discussions rather than waiting to be asked.',1),
(rb,'rb_l4','2026-06-15','Julian Wexford · Investment Director','positive','Good progress on the fixed-income module. Pre-trade compliance review completed on time.',2),

(rb,'rb_l5','2026-09-05','Julian Wexford · Investment Director','positive','Priya''s ESG integration report is exactly the kind of thought leadership we want to develop. Sharing with the wider investment team.',1),
(rb,'rb_l5','2026-07-22','Julian Wexford · Investment Director','positive','Consumer Duty lunch-and-learn was very well received. Strong contribution to team development.',2),

(rb,'rb_l6','2026-09-12','Julian Wexford · Investment Director','positive','Clara is performing at the top of the cohort. Her client interactions are professional and technically strong. The new-client pitch she led last week was excellent.',1),
(rb,'rb_l6','2026-08-01','Julian Wexford · Investment Director','constructive','Clara should focus on the midpoint assessment retake — the underlying knowledge is there but the exam technique needs polishing.',2),
(rb,'rb_l6','2026-06-18','Julian Wexford · Investment Director','positive','Strong half-year review. Attribution and suitability work is particularly impressive.',3),

(rb,'rb_l7','2026-09-08','Julian Wexford · Investment Director','positive','Rosa has settled in well. Good attitude and asks the right questions in client review observations.',1),
(rb,'rb_l7','2026-07-30','Julian Wexford · Investment Director','constructive','Need to spend more time on the technical modules — foundational knowledge gaps will slow client-readiness.',2),

(rb,'rb_l8','2026-09-14','Julian Wexford · Investment Director','positive','Felix is ready for the IM title. His client outcomes data is the strongest in the cohort and his mentoring of Sophie and Rosa is genuinely valued.',1),
(rb,'rb_l8','2026-08-10','Julian Wexford · Investment Director','positive','Excellent IC presentation. Promotion paperwork being prepared.',2),

(rb,'rb_l9','2026-09-03','Julian Wexford · Investment Director','constructive','Elliot''s systems knowledge is a real asset but the regulatory module gaps need to be addressed before client responsibilities can be expanded.',1),
(rb,'rb_l9','2026-07-25','Julian Wexford · Investment Director','positive','Good progress on the fixed-income track. Workflow mapping project well executed.',2);

-- ─────────────────────────────────────────────────────────────────
-- 10. persona_module_adaptations
--     Show "Diagnostic only" and "Microlearning" tags on cohort journey
-- ─────────────────────────────────────────────────────────────────
INSERT INTO embarksmv2.persona_module_adaptations (account_id, persona_code, module_code, adaptation_type, reason, visible_to_learner) VALUES
-- Clara (rb_l6): prior buy-side experience means she skipped BK1/BK3 via diagnostic
(rb,'rb_l6','bk1.intro_wealth_rathbones','diagnostic_only','Passed quick diagnostic — prior IM experience covers this module.', true),
(rb,'rb_l6','bk3.markets_macro_assets','diagnostic_only','Demonstrated prior knowledge via diagnostic; key gaps addressed via condensed module.', true),
(rb,'rb_l6','bk2.kyc_suitability','microlearning','Midpoint check highlighted ATR/CFL distinction gap; micro-learning assigned.', true),
-- Theo (rb_l3): fast-track technical learner
(rb,'rb_l3','bk1.intro_wealth_rathbones','diagnostic_only','Passed quick diagnostic — prior asset management experience.', true),
(rb,'rb_l3','bk3.markets_macro_assets','diagnostic_only','Strong academic background; diagnostic passed at 90%.', true),
(rb,'rb_l3','tk2.bloomberg_essentials','diagnostic_only','Bloomberg proficiency pre-validated from previous employer.', true),
-- Felix (rb_l8): senior AIM, many modules already mastered
(rb,'rb_l8','bk1.intro_wealth_rathbones','diagnostic_only','Comprehensive prior IM experience; diagnostic passed.', true),
(rb,'rb_l8','bk3.markets_macro_assets','diagnostic_only','Prior portfolio management experience covers module scope.', true),
(rb,'rb_l8','bk4.portfolio_construction','diagnostic_only','Portfolio construction expertise pre-validated by manager.', true),
(rb,'rb_l8','tk2.bloomberg_essentials','diagnostic_only','Bloomberg certification from prior role.', true),
-- Maya (rb_l2): private banking background means some client modules condensed
(rb,'rb_l2','bk1.intro_wealth_rathbones','microlearning','Prior private-banking orientation completed; condensed to key differences.', true),
-- Owen (rb_l4): compliance background
(rb,'rb_l4','bk5.regulatory_landscape','diagnostic_only','Prior compliance analyst role; regulatory knowledge pre-validated.', true)
ON CONFLICT (account_id, persona_code, module_code) DO NOTHING;

END $$;
