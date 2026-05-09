## Goal

Complete Step 7: make the Rathbones account appear in the account switcher with proper branding and a working normalized data structure.

## Approach

Mirror the existing **Pinnacle Capital** pattern in `src/contexts/AccountContext.tsx`:

1. **Special-case Rathbones in `loadAccounts`** (parallel to the Pinnacle branch). Instead of running it through generic `normalizeFromLegacy`, build it by deep-cloning the Cornerstone Demo normalized account and overriding:
   - `branding.name = "Rathbones"`
   - `branding.accentColor = "#1a2547"` (deep navy, per Rathbones palette memory)
   - `branding.logo = null` (placeholder building icon)
   - `isDefault = false`, `id = <Rathbones DB id>`
   - `contentNameMap = { "Cornerstone": "Rathbones", "cornerstone": "rathbones", "CORNERSTONE": "RATHBONES" }`

2. **Replace the user/employee/hierarchy slice** with the 11 rb-* records from `accounts.data.employees`:
   - `rb-admin` → admin (top)
   - `rb-mgr` (Julian Wexford) → manager, reports to `rb-admin`
   - `rb-l1`–`rb-l9` → learners, all report to `rb-mgr`
   - Build `usersById`, `employeesById`, `hierarchyMap`, `teamMembers`, `namedEmployees` from these 11 only (drop cloned Cornerstone people).

3. **Keep the cloned demo fixtures** (`profileData`, `skillTargets`, `learningModules`, `rolePlays`, `assessments`, `peopleGraph`, `signals`, etc.) so pages render. For Clara (`rb-l6`), alias the rich Cornerstone primary-persona profileData to her id so My360 / Embark AI work end-to-end. The other 8 personas fall back to `generateProfileData`.

4. **Pinnacle clone source.** Existing Pinnacle code already searches for `branding.name === "Rathbones"` in the cache. Order the passes so Rathbones is built before Pinnacle — no Pinnacle logic change needed.

5. **Account switcher.** No changes — `AccountSwitcher.tsx` already iterates `accounts` from context.

## Out of scope

- No DB changes, no migrations.
- No catalog/cohort/persona table changes (already done).
- No fresh fixture authoring — fixtures are cloned + relabeled (per your "proceed as planned" choice).
- No Rathbones logo asset.

## Files touched

- `src/contexts/AccountContext.tsx` — add `buildRathbonesNormalized(...)` helper + special-case branch in `loadAccounts`.

## Verification

- Switcher shows three accounts: Cornerstone Demo, **Rathbones**, Pinnacle Capital.
- Switching to Rathbones → sidebar reads "Rathbones", navy accent, org tree shows admin → Julian → 9 learners.
- Pinnacle still works (clones from new Rathbones normalized object).
- Logging in as Clara (rb-l6) → My360 + Embark AI render with Associate IM cohort content.
