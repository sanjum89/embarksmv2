-- Add preset key to UBS accent_color so the branding panel resolves the correct preset.
UPDATE embarksmv2.accounts
SET accent_color = '{"preset":"ubs","primary":"0 0% 12%","accent":"0 100% 46%","sidebar":"0 0% 7%"}'
WHERE id = '7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e';
