

## Fix "Rathbones" Showing in My 360 Team Field for Pinnacle

### Problem
In `src/pages/My360.tsx`, the `team` field (line 251) is displayed raw without content substitution, so Pinnacle Capital users see "Rathbones Investment Management Pod" instead of "Pinnacle Capital Investment Management Pod".

### Fix
Wrap `profileData.team` in the existing `substitute()` call — same pattern already used for `profileData.program` on line 256.

### File: `src/pages/My360.tsx`
- Line 251: Change `{profileData.team}` → `{substitute(profileData.team)}`

Also check `src/components/onboarding/FirstLoginTour.tsx` line 195 for the same issue — the team field there also needs `substitute()`.

### Scope
One-line change per file. The `substitute()` function and `useContentSubstitution` hook are already imported and used in My360. For FirstLoginTour, the hook may need to be imported.

