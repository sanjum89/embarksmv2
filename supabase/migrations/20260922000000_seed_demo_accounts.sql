-- Seed canonical demo account rows with deterministic UUIDs.
-- These must exist before catalog-import, reset-rathbones-demo, and mirror-account-content run.
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.

-- 1. Remove any Rathbones / Pinnacle rows that were auto-created with random UUIDs
--    (AccountContext may have inserted them before this migration ran).
DELETE FROM embarksmv2.accounts
WHERE name = 'Pinnacle Capital'
  AND id != '08b9c4d5-f4ec-44bb-8bc2-099d9848f465';

DELETE FROM embarksmv2.accounts
WHERE name = 'Rathbones'
  AND id != '6c49ca7c-fecb-4b34-a690-7e4e28bb2194';

-- 2. Insert Rathbones demo account
INSERT INTO embarksmv2.accounts (id, name, is_default, data)
VALUES ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194', 'Rathbones', false, '{}')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Pinnacle Capital demo account
INSERT INTO embarksmv2.accounts (id, name, is_default, data)
VALUES ('08b9c4d5-f4ec-44bb-8bc2-099d9848f465', 'Pinnacle Capital', false, '{}')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Rathbones cohort
INSERT INTO embarksmv2.cohorts (id, account_id, cohort_code, cohort_title, domain_code, role_cohort_code)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '6c49ca7c-fecb-4b34-a690-7e4e28bb2194',
  'assoc_im_2026',
  'Associate IM 2026',
  'investment_management',
  'assoc_im'
)
ON CONFLICT (account_id, cohort_code) DO NOTHING;

-- 5. Seed learning tracks for Rathbones account (used by catalog-import)
INSERT INTO embarksmv2.learning_tracks (account_id, code, name, display_order)
VALUES
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194', 'business_knowledge',                  'Business Knowledge',                    1),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194', 'technical_knowledge',                 'Technical Knowledge',                   2),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194', 'behavioural_skills',                  'Behavioural Skills',                    3),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194', 'certification_professional_standards', 'Certification & Professional Standards', 4),
  ('6c49ca7c-fecb-4b34-a690-7e4e28bb2194', 'other_enablers',                      'Other Enablers',                        5)
ON CONFLICT (account_id, code) DO NOTHING;
