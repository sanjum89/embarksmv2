

## Fix My360 Skills Display and Gap Analysis

### Problem

1. **Core Skills & Inferred Skills sections** — already correctly implemented (using `roleSkillsCurrent` from source-based bucketing and `otherSkills`). If they're not showing, it's likely a data loading issue.

2. **Skills & Gap section** — the gap derivation functions (`deriveSkillGaps`, `deriveRadarSkills`) iterate over the **required** skills list as the driver. This means:
   - Skills that exist in role requirements but the employee doesn't have still appear
   - Name mismatches between employee skills and role requirements cause "missing" lookups
   - The employee's actual core skills are not the basis of comparison

### Solution

Change the Skills & Gap logic so the **employee's core skills** drive the comparison, looking up the matching role/project requirement to find the target proficiency.

### Changes

#### 1. `src/lib/skillUtils.ts` — Add a new function `deriveGapsFromEmployee`

Create a new gap derivation function that iterates over the employee's current skills (not the requirements) and finds matching required proficiency:

```typescript
export function deriveGapsFromEmployee(
  current: SkillEntry[],
  required: SkillRequirement[]
): GapResult[] {
  return current.map((cur) => {
    const req = required.find((r) => r.skill_name === cur.skill_name);
    if (!req) {
      // No requirement for this skill — no gap
      return { skill_name: cur.skill_name, currentLevel: cur.proficiency, requiredLevel: cur.proficiency, gapLevel: "No gap" as GapLevel };
    }
    const curIdx = proficiencyIndex(cur.proficiency);
    const reqIdx = proficiencyIndex(req.proficiency);
    const diff = reqIdx - curIdx;
    let gapLevel: GapLevel = "No gap";
    if (diff >= 2) gapLevel = "High gap";
    else if (diff === 1) gapLevel = "Medium gap";
    return { skill_name: cur.skill_name, currentLevel: cur.proficiency, requiredLevel: req.proficiency, gapLevel };
  });
}
```

Add a similar `deriveRadarFromEmployee` function that drives from employee skills, looking up targets from requirements.

#### 2. `src/pages/My360.tsx` — Use employee-driven gap functions

Update the `radarSkills` and `allGapRows` useMemo hooks:

- When `gapSource === "Role"`: use `deriveGapsFromEmployee(profileData.roleSkillsCurrent, profileData.roleSkillsRequired)` — compares Clara's 12 core skills against role requirement proficiency levels
- When `gapSource === "Project"`: use `deriveGapsFromEmployee(profileData.projectSkillsCurrent, profileData.projectSkillsRequired)` — same logic for project skills
- Same change for `deriveRadarSkills` → use the new employee-driven radar function

This ensures the gap matrix shows all of Clara's core skills with their current level, the target from role/project requirements, and the computed gap. Skills without a matching requirement show as "No gap".

### Result

- **Core Skills pills**: Clara's 12 core skills at actual proficiency
- **Inferred Skills pills**: Clara's 4 inferred skills
- **Skills & Gap (Role filter)**: Shows Clara's core skills compared against Investment Manager role requirements, highlighting gaps
- **Skills & Gap (Project filter)**: Shows project skills compared against project requirements
- **Radar/Bar chart**: Same employee-driven comparison

### Files Modified

| File | Change |
|---|---|
| `src/lib/skillUtils.ts` | Add `deriveGapsFromEmployee` and `deriveRadarFromEmployee` functions |
| `src/pages/My360.tsx` | Use employee-driven gap functions in `radarSkills` and `allGapRows` computations |

