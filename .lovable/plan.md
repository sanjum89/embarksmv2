## Goal
My360 currently shows only the line manager (Julian Wexford for all 9 Rathbones learners). Add the assigned mentor next to it, using the single source of truth already established (`src/data/rathbonesMentors.ts` + `mentor_assignments` table) so Clara sees "Manager: Julian Wexford · Mentor: Margaret Atherton" — consistent with Cohort Hub, Action Centre, and Agent One.

## Scope
Frontend-only. No DB changes (mentor data already backfilled in prior migration).

## Changes

**1. `src/hooks/useMy360Data.ts`**
- Add a `mentor?: { employeeId: string; name: string; title?: string }` field to the returned state.
- After loading the employee, query `mentor_assignments` for `account_id + mentee_employee_id = employeeId AND status='active'`, then resolve the mentor's display name from the account's `employees` array (fallback to `LEARNER_MENTOR_MAP` from `src/data/rathbonesMentors.ts` if no row exists, to cover non-Rathbones accounts gracefully).

**2. `src/pages/NewMy360.tsx`**
- Pass `mentorName` (and optional `mentorTitle`) to `<ProfileHero />` alongside the existing `managerName`.

**3. `src/components/my360-v2/ProfileHero.tsx`**
- Add `mentorName?: string` prop.
- Render a second pill in the meta row after the Manager pill: `<UserCheck /> Mentor: {mentorName}` using `lucide-react`'s `UserCheck` icon, styled identically to the manager pill.
- Keep the Manager pill labelled "Manager: {name}" (currently shows just the name — relabel for clarity now that two people appear).

**4. `src/components/my360-v2/IdentityHeader.tsx`** (used elsewhere — same change for consistency)
- Same `mentorName` prop + pill addition.

## Verification
- Log in as Clara (rb-l6) → hero shows "Manager: Julian Wexford · Mentor: Margaret Atherton".
- Spot-check 2 other personas (e.g. Theo rb-l3, Felix rb-l8) → mentors match what Cohort Hub and Agent One display.
- Non-Rathbones account (no `mentor_assignments` row) → only Manager pill shown, no broken UI.

## Out of scope
- Reassigning line managers per persona (all 9 still report to Julian Wexford).
- Surfacing mentor anywhere outside the My360 hero.
