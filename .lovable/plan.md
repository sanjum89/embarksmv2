

## Structured Skills Data & Dynamic Gap Derivation

### What Changes

**1. New types (`src/types/learning.ts`)**
- Add `SkillEntry` type: `{ skill_name: string; proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert" | "Master"; assessment_year: number }`
- Add `SkillRequirement` type: `{ skill_name: string; proficiency: Proficiency }` (no year — requirements don't have one)
- Add helper for compact display: `proficiencyShort` map (`B`, `I`, `A`, `E`, `M`) and `proficiencyNumeric` map for radar chart values (20, 40, 60, 80, 100)

**2. Restructure `ProfileData` in `src/data/mock.ts`**

Replace the current flat structure with structured skill arrays on the profile:

```
ProfileData {
  // ... existing profile fields (title, location, manager, etc.)
  // NEW profile fields for Maya
  status?: string;           // "New Hire"
  department?: string;       // "Customer Support"  
  program?: string;          // "Apple Support Program"
  team?: string;             // "Apple L1 Customer Care"
  
  // STRUCTURED SKILLS — replaces coreSkills: string[]
  roleSkillsCurrent: SkillEntry[];      // employee's current proficiency in role skills
  projectSkillsCurrent: SkillEntry[];   // employee's current proficiency in project skills
  otherSkills: SkillEntry[];            // standalone skills (not role/project required)
  
  // REQUIREMENTS — what the role/project demands
  roleSkillsRequired: SkillRequirement[];
  projectSkillsRequired: SkillRequirement[];
  
  // Role/Project explore data
  roleExploreData?: { ... }
  projectExploreData?: { ... }
  
  // Keep existing: roleSnapshotText, projectSnapshotText, summary
  // REMOVE: coreSkills, radarSkills, skillGapRows (now derived)
}
```

**3. Sam Taylor → Maya Thompson (user u6)**

Update the u6 profile with all provided data. Core skills = role skills current (matching role required exactly, so no role gaps). Project skills current all Beginner except Apple Billing (Intermediate). 10 other skills as specified.

**4. Gap derivation utility (`src/lib/skillUtils.ts`)**

```typescript
function deriveSkillGaps(current: SkillEntry[], required: SkillRequirement[]): GapResult[]
// Compares each required skill against current proficiency
// Returns: { skill_name, currentLevel, requiredLevel, gapLevel: "No gap" | "Medium gap" | "High gap" }
// Gap logic: if current >= required → No gap; diff of 1 level → Medium; diff of 2+ → High

function deriveRadarSkills(roleSkillsCurrent, roleSkillsRequired, projectSkillsCurrent, projectSkillsRequired): RadarEntry[]
// Converts proficiency to numeric (B=20, I=40, A=60, E=80, M=100)
// Returns array for recharts radar/bar chart

function deriveSkillGapRows(roleGaps, projectGaps): SkillGapRow[]
// Formats gaps into the existing left/right row layout used by the UI
```

**5. My360.tsx binding changes**

- Import `deriveSkillGaps`, `deriveRadarSkills`, `deriveSkillGapRows` 
- Replace `profileData.radarSkills` → `useMemo(() => deriveRadarSkills(...))`
- Replace `profileData.skillGapRows` → `useMemo(() => deriveSkillGapRows(...))`
- Core Skills display: derive from `roleSkillsCurrent` (show skill names)
- Other Skills display: use `profileData.otherSkills` with `SkillEntry` format — display compact as `I, 25` or `A, 26`
- Role/Project explore data bound to chat panel responses
- Update profile card to show new fields (status, department, program, team) where relevant
- Skills & Gap section: add working dropdown to toggle between "Role" and "Project" gaps
- The "Gap" dropdown filters: "All", "Gap only", "No gap"

**6. Alex (u1) profile migration**

Restructure u1's existing data into the new format so both profiles use the same structure. The current hardcoded `radarSkills` and `skillGapRows` values will be expressed as `roleSkillsCurrent`, `roleSkillsRequired`, `projectSkillsCurrent`, `projectSkillsRequired` and derived at render time.

### Files Changed
- `src/types/learning.ts` — new skill types
- `src/lib/skillUtils.ts` — new file, gap derivation logic  
- `src/data/mock.ts` — restructured `ProfileData`, Maya Thompson data, u1 migration
- `src/pages/My360.tsx` — bind derived data, functional dropdowns

### What Stays the Same
- All existing UI components, layout, tabs, radar/bar chart, career timeline
- Chat panel integration
- Other Skills hover card behavior
- Profile card layout and animations

