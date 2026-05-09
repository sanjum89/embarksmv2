## Goal

The Rathbones account currently shows the Cornerstone logo and default theme because the `accounts` row for Rathbones has `logo = NULL` and `accent_color = NULL`. The branding plumbing already exists end-to-end (the "rathbones" preset is wired into `useBrandColors.ts` with the navy/peach palette from memory, and `AccountSwitcher` renders `account.logo` when present). We just need to populate those two DB columns.

## Steps

1. **Generate a Rathbones wordmark logo** — a clean navy "Rathbones" mark on transparent background, sized for the sidebar (the switcher renders it at h-5 w-5 collapsed, so a square mark works best; we'll generate a square monogram "R" wordmark in deep navy `hsl(230 75% 15%)`).

2. **Upload the logo to the existing `logos` storage bucket** (already public) using `supabase--storage_upload`, then capture the public URL.

3. **Update the Rathbones `accounts` row** via a migration with:
   - `logo = '<public URL from step 2>'`
   - `accent_color = '{"primary":"230 75% 15%","accent":"12 55% 85%","sidebar":"230 75% 10%"}'`  
     (matches the existing "rathbones" preset in `useBrandColors.ts` and the `mem://branding/rathbones-palette` memory)

4. **Verify in preview**: switch to Rathbones in the account switcher → sidebar shows new navy logo, primary buttons / active nav / focus rings turn navy, peach used as subtle secondary surface tint. Pinnacle Capital (which clones from Rathbones at runtime) should keep its own DB-stored branding unaffected since its row has its own `logo`/`accent_color` overrides applied after the clone.

## Out of scope

- No code changes to `AccountContext`, `useBrandColors`, `AccountSwitcher`, or `accountDefaults.ts` — branding wiring is already correct.
- No changes to Pinnacle.
- No fresh content authoring.

## Notes

- `mem://branding/rathbones-palette` confirms primary navy `230 75% 15%` + peach accent `12 55% 85%` with "Primary-as-Interactive" logic — `useBrandColors.deriveThemeVars` already triggers that branch automatically because the peach accent lightness is > 75.
- The light/dark derivation logic in `useBrandColors` will handle dark mode automatically.
