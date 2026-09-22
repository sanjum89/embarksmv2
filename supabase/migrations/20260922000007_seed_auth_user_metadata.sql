-- Set app_metadata for each demo auth user.
-- app_metadata is stored in raw_app_meta_data and can only be set server-side.
-- Matched by email so this is safe to re-run if users are recreated.

-- CSOD / super-admin: sees all accounts, accesses DevTools
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"superadmin"}'::jsonb
WHERE email = 'admin@csod.com';

-- Rathbones admin: sees Rathbones only
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"account_ids":["6c49ca7c-fecb-4b34-a690-7e4e28bb2194"]}'::jsonb
WHERE email = 'admin@rathbones.com';

-- Pinnacle admin: sees Pinnacle Capital only
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"account_ids":["08b9c4d5-f4ec-44bb-8bc2-099d9848f465"]}'::jsonb
WHERE email = 'admin@pinnacle.com';

-- UBS users: both see UBS only
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"account_ids":["7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e"]}'::jsonb
WHERE email IN ('admin@ubs.com', 'ubsdemo@csod.com');
