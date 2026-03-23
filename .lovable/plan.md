

## Plan: Fix Skills Data Discrepancy Between Agent One and My 360

### Problem

The `profileDataGenerator.ts` builds `roleSkillsCurrent` from ALL employee skills (not just role-relevant ones). This causes:
- **My 360** "Core Skills" shows every skill the employee has, not just role-related ones
- **Agent One** combines role + project + other skills, leading to duplicates (skills appear in both `roleSkillsCurrent` and `otherSkills`)
- **"Other Skills"** section appears empty or underpopulated because the role skills set already consumed everything

### Root Cause

In `profileDataGenerator.ts` lines 27-31:
```typescript
// Currently: ALL employee skills go into roleSkillsCurrent
const roleSkillsCurrent = employeeSkills.map(s => ({ ... }));
```

Should be: only employee skills that match role requirements go into `roleSkillsCurrent`.

### Fix

**File: `src/lib/profileDataGenerator.ts`**

1. **`roleSkillsCurrent`** — filter to only include skills whose name matches a role requirement
2. **`otherSkills`** — filter to exclude skills in role requirements AND project requirements (currently only excludes role)
3. This ensures three non-overlapping skill buckets: Role, Project, Other

```text
Before (Helena with 10 skills, 6 role-required):
  roleSkillsCurrent: [all 10 skills]     ← wrong
  otherSkills: [4 non-role skills]        ← correct count but duplicated
  
After:
  roleSkillsCurrent: [6 role skills only] ← only matching role reqs
  otherSkills: [remaining skills not in role OR project reqs]
```

**Changes:**
| Line | Change |
|------|--------|
| 27-31 | Filter `roleSkillsCurrent` to only skills matching `roleSkillsRequired` names, with fallback proficiency |
| 66-73 | Update `otherSkills` to exclude both role AND project required skill names |

### No changes needed

- `AgentOneContext.tsx` — combining all three categories is correct once the buckets are non-overlapping
- `My360.tsx` — already reads from profileData correctly
- `accountParser.ts` — handles explicit JSON profile data which is assumed correct as-is

### Files changed

| File | Change |
|------|--------|
| `src/lib/profileDataGenerator.ts` | Fix roleSkillsCurrent to only include role-matching skills; fix otherSkills to exclude both role and project skills |

