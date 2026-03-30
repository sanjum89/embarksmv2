

## Fix: Clara's My360 Shows Wrong Skills Data

### Problem

Clara (u12) has explicit skills defined on her employee record in `accountDefaults.ts`, but the default account's `profileData` is set to `profileDataByUser` from `mock.ts`, which has no entry for `u12`. The My360 page falls back to `u1` (Hitesh's) profile data — showing completely wrong skills.

The `generateProfileData` function exists and correctly derives profile data from employee skills, but it's only called for uploaded accounts with empty profileData. The default account never uses it.

### Fix in `src/lib/accountDefaults.ts`

After setting Clara's skills and role (around line 920), call `generateProfileData` for employees that have explicit skills and merge the results into the profileData map. This ensures Clara's My360, Agent One chat, and all other pages see her actual skills.

**Specifically:**
1. Import `generateProfileData` from `@/lib/profileDataGenerator`
2. After the normalized account object is constructed (line ~983), iterate employees with explicit `skills` arrays and generate their profileData entries using `generateProfileData`, then merge those into the account's `profileData` — overriding the static fallback for those specific employees

This way:
- Employees with explicit skills (Clara) get auto-generated profile data from their employee record
- Other employees (u1–u11) continue using the existing static `profileDataByUser` entries
- All pages and Agent One chat that consume `profileData` will see correct skills

### Files Modified

| File | Change |
|---|---|
| `src/lib/accountDefaults.ts` | Import `generateProfileData`, after building the account object merge generated profileData for employees with explicit skills |

