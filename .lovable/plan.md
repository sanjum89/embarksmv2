

## Fix Clara's My360: Skills Override Destroying Good Metadata

### Root Cause

The merge in `AccountContext.tsx` does `{ ...staleProfileData, ...generatedProfileData }`, which completely replaces ALL fields. The generated profile has correct skills but inferior metadata:

- **roleSnapshotText**: Generated = `"Team Member"` (no role catalog in DB) — Stale DB = `"Fastest likely ramp among the new hires..."` (good copy)
- **projectSnapshotText**: Generated = `"No active projects"` — Stale DB = `"Assigned across investment portfolio..."` (good copy, but user confirmed no projects yet — so "No active projects" is acceptable)
- **location**: Generated = `"—"` (hris.location not checked) — Stale DB = `"London"`
- **roleSkillsCurrent**: Generated = correct 12 core skills — Stale DB = wrong 10 skills with wrong proficiencies

The full merge overwrites the good metadata fields with the bad generated fallbacks.

### Fix (2 changes)

#### 1. `src/contexts/AccountContext.tsx` — Selective merge

Change the merge to only override **skill arrays** from generated data, preserving existing metadata (snapshots, location, team, etc.):

```typescript
// Only override skill-related fields, keep existing metadata
const skillFields = ['roleSkillsCurrent', 'roleSkillsRequired', 'projectSkillsCurrent', 'projectSkillsRequired', 'otherSkills'];
const skillOverrides: any = {};
for (const key of skillFields) {
  if (genProfile[key]) skillOverrides[key] = genProfile[key];
}
parsed.profileData[empId] = { ...parsed.profileData[empId], ...skillOverrides };
```

This preserves `roleSnapshotText`, `projectSnapshotText`, `location`, `summary`, `team`, etc. from the existing profileData while replacing only the skill arrays with the correctly bucketed data from `generateProfileData`.

#### 2. Database update — Fix stale skills in Rathbones profileData

Update `profileData.RAT-E003` in the Rathbones account to use the correct skill format (`skill_name`/`proficiency` with `source` tags):

- **roleSkillsCurrent**: 12 core skills matching employee record (Business Development = Intermediate, rest = Advanced, all assessmentYear 2026, source "core")
- **otherSkills**: 4 inferred skills (Intermediate, no assessmentYear, source "inferred")
- Keep existing good metadata: roleSnapshotText, projectSnapshotText, location ("London"), etc.

### What the user needs to provide (missing data)

Based on the audit, the Rathbones account JSON is missing:

| Data | Status | Impact |
|---|---|---|
| `rolesCatalog` | Missing | Role Snapshot falls back to stale profileData text (OK per user preference) |
| `projects` + `projectAssignments` | Missing | Project Snapshot shows "No active projects", Skills & Gap (Project) empty (OK per user — "No projects yet") |
| `employee.location` | Missing (only in `hris.location`) | Location shows "—" unless stale profileData has it (user said don't use hris fallback) |

No additional data needed from the user for this fix — the selective merge + DB update will resolve all three visible issues.

### Result

- Core Skills: 12 correct skills (11 Advanced + 1 Intermediate)
- Inferred Skills: 4 correct skills
- Role Snapshot: Shows the provided copy from profileData
- Project Snapshot: "No active projects" (correct per user)
- Location: "London" (preserved from stale profileData)
- Skills & Gap (Role): Will show gap analysis once rolesCatalog is provided
- Skills & Gap (Project): Empty until projects are added

### Files Modified

| File | Change |
|---|---|
| `src/contexts/AccountContext.tsx` | Selective merge: only override skill arrays from generated data |
| Database (SQL) | Update Rathbones profileData.RAT-E003 skills to correct format |

