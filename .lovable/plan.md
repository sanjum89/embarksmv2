

## Fix: Skills Display Should Use Employee Skills, Not Role Requirements

### Problem

Currently, `profileDataGenerator.ts` derives `roleSkillsCurrent` by iterating over the **role's required skills** and looking up each one on the employee. This means:
- Skills the employee has but the role doesn't require get missed from "Core Skills"
- Skills the role requires but the employee doesn't have show up as "Beginner"
- Name mismatches between employee skills and role skills cause duplicates

The user wants: **Core Skills = employee skills with `source: "core"`**, and **Inferred Skills = employee skills with `source: "inferred"`**. Role requirements should only be used for gap analysis.

### Changes

#### 1. `src/lib/profileDataGenerator.ts`

When an employee has skills with explicit `source` tags, change the bucketing:

- **`roleSkillsCurrent`** (used as "Core Skills" in My360): employee skills where `source === "core"`, mapped to `{ skill_name, proficiency, assessment_year, source }`
- **`roleSkillsRequired`** (used for gap analysis): keep as-is from role requirements
- **`otherSkills`** (used as "Inferred Skills"): employee skills where `source === "inferred"`
- **`projectSkillsCurrent`** / **`projectSkillsRequired`**: keep as-is from project requirements

Add a check: if any employee skill has a `source` field, use the source-based bucketing. Otherwise, fall back to the existing role-matching logic for backward compatibility.

#### 2. No other files need changes

The My360 page already renders `roleSkillsCurrent` as "Core Skills" and `otherSkills` as "Inferred Skills". The radar chart and gap matrix use `roleSkillsCurrent` vs `roleSkillsRequired` — which will now correctly compare the employee's core skills against the role's requirements for gap detection.

### Result

- Core Skills pills: Clara's 12 core skills at their actual proficiency
- Inferred Skills: Clara's 4 inferred skills
- Skills & Gap matrix: compares core skills against role requirements to find gaps
- No phantom "Beginner" entries from unmatched role skills

### Files Modified

| File | Change |
|---|---|
| `src/lib/profileDataGenerator.ts` | When employee skills have `source` tags, bucket by source field instead of role-matching for `roleSkillsCurrent` and `otherSkills` |

