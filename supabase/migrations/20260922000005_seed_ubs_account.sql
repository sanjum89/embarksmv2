-- Seed the UBS demo account.
-- Canonical ID is hardcoded so AccountContext.tsx and DevTools can reference it.
-- Content is populated via DevTools → Mirror Pinnacle → UBS after Pinnacle is ready.

INSERT INTO embarksmv2.accounts (
  id,
  name,
  logo,
  logo_superlight,
  accent_color,
  use_case_context,
  is_default,
  data
) VALUES (
  '7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e',
  'UBS',
  '/ubs-logo.png',
  '/ubs-logo.png',
  '{"primary":"0 0% 12%","accent":"0 100% 46%","sidebar":"0 0% 7%"}',
  'UBS is a leading global wealth manager and investment bank. This demo shows a UBS Wealth Management Associate Investment Manager onboarding journey.',
  false,
  '{}'
)
ON CONFLICT (id) DO UPDATE SET
  name             = EXCLUDED.name,
  logo             = EXCLUDED.logo,
  logo_superlight  = EXCLUDED.logo_superlight,
  accent_color     = EXCLUDED.accent_color,
  use_case_context = EXCLUDED.use_case_context;
