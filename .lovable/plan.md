

## Add Core and Inferred Skills for Clara Whitfield

### What Changes

Add explicit skills data to Clara's employee record with a `source` field on `EmployeeSkill` to distinguish core vs inferred skills. Assign Clara the Investment Manager role. Update profile data generator to preserve the source field. Use **2026** as the assessment year for all skills.

### 1. Extend `EmployeeSkill` type (`src/types/account-v2.ts`)

Add optional `source` field:
```ts
export interface EmployeeSkill {
  skillName: string;
  proficiency: string;
  assessmentYear?: number;
  source?: "core" | "inferred";
}
```

### 2. Add Clara's skills and roleId in `accountDefaults.ts`

Set Clara's `roleId` to `"role-inv-mgr"` and populate her `skills` array with 16 skills, all with `assessmentYear: 2026`:

**Core skills (12):**
- Client Relationship Management — Advanced
- Investment Communication — Advanced
- Investment Research — Advanced
- Portfolio Construction — Advanced
- Portfolio Management — Advanced
- Suitability and Documentation — Advanced
- Regulatory Compliance — Advanced
- Portfolio Risk Alignment — Advanced
- Commercial Awareness — Advanced
- Business Development — Intermediate
- Relationship Building — Advanced
- Active Listening — Advanced

**Inferred skills (4):**
- Mentoring and Coaching — Intermediate
- Stakeholder Management — Intermediate
- Process Improvement — Intermediate
- Knowledge Sharing — Intermediate

### 3. Update profile data generator (`src/lib/profileDataGenerator.ts`)

Preserve the `source` field when mapping skills into profile buckets (`roleSkillsCurrent`, `projectSkillsCurrent`, `otherSkills`).

### 4. Update `ProfileData` type in `src/data/mock.ts`

Add optional `source` field to skill entry types in `ProfileData`.

### Files Modified

| File | Change |
|---|---|
| `src/types/account-v2.ts` | Add `source?: "core" \| "inferred"` to `EmployeeSkill` |
| `src/lib/accountDefaults.ts` | Set Clara's `roleId`, add 16 skills with source tags and `assessmentYear: 2026` |
| `src/lib/profileDataGenerator.ts` | Preserve `source` field in skill mapping |
| `src/data/mock.ts` | Add `source?` field to `ProfileData` skill entry types |

