

## Preserve `source` field through parser for Core vs Inferred skill separation

### Problem

`accountParser.ts` → `parseSkills()` drops the `source` field when parsing skill objects from the database JSON. Without `source: "core" | "inferred"`, the profile data generator can't distinguish core from inferred skills and falls back to legacy role-matching logic — mixing everything together.

### Changes

#### 1. `src/lib/accountParser.ts` — `parseSkills` function

Add `source` field preservation when parsing object-format skills:

```typescript
// Line 61-65: add source field
return {
  skillName: s?.skillName || s?.skill_name || s?.name,
  proficiency: normalizeProficiency(s?.proficiency || s?.level),
  assessmentYear: s?.assessmentYear || s?.assessment_year,
  source: s?.source,  // ← ADD THIS LINE
};
```

Also handle string-array skills with a proficiency map — cross-reference proficiency from the map when skills are plain strings (line 54-59).

#### 2. Database update — Rathbones account Clara (RAT-E003)

Update Clara's skills in the Rathbones account JSON to use object format with explicit `source` tags:

**Core (12 skills, assessmentYear: 2026):**
Client Relationship Management — Advanced, Investment Communication — Advanced, Investment Research — Advanced, Portfolio Construction — Advanced, Portfolio Management — Advanced, Suitability and Documentation — Advanced, Regulatory Compliance — Advanced, Portfolio Risk Alignment — Advanced, Commercial Awareness — Advanced, Business Development — Intermediate, Relationship Building — Advanced, Active Listening — Advanced

**Inferred (4 skills, no assessmentYear):**
Mentoring and Coaching — Intermediate, Stakeholder Management — Intermediate, Process Improvement — Intermediate, Knowledge Sharing — Intermediate

### Result

- Parser preserves `source` → generator correctly buckets core vs inferred
- My360 "Core Skills" section shows 12 core skills
- My360 "Inferred Skills" section shows 4 inferred skills
- Skills & Gap matrix compares core skills against role requirements

### Files Modified

| File | Change |
|---|---|
| `src/lib/accountParser.ts` | Add `source` field to object skill parsing |
| Database (SQL) | Update Rathbones Clara's skills to object format with source tags |

