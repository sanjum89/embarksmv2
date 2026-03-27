

## Roles, Projects & Learning Cohorts as First-Class Entities

### What Changes

The data model already has `AccountRole`, `AccountProject`, and `ProjectAssignment`. We need to:
1. Enrich Role and Project with descriptions
2. Add a new **Learning Cohort** entity
3. Support **user-level overrides** for role/project descriptions
4. Wire cohort assignments and progress
5. Update My360 to show cohorts and use the richer data

---

### 1. Extend Types (`src/types/account-v2.ts`)

**AccountRole** — add fields:
- `description?: string` (full description)
- `snapshotText?: string` (2-line condensed version for My360)

**AccountProject** — add fields:
- `snapshotText?: string` (2-line condensed version)
- (already has `description`)

**New: LearningCohort**
```typescript
interface LearningCohort {
  id: string;
  name: string;
  description?: string;
  type?: "onboarding" | "upskilling" | "compliance" | "custom";
  skillTargetIds: string[];        // assigned skill targets
  managerEmployeeIds: string[];    // who manages this cohort
  status?: "active" | "completed" | "draft";
  startDate?: string;
  endDate?: string;
}
```

**New: CohortAssignment** (many-to-many employee↔cohort)
```typescript
interface CohortAssignment {
  employeeId: string;
  cohortId: string;
  role: "member" | "manager";      // learner vs manager of cohort
  progress?: number;               // 0-100, user-level
}
```

**New: EmployeeEntityOverride** (user-level description overrides)
```typescript
interface EmployeeEntityOverride {
  employeeId: string;
  entityType: "role" | "project";
  entityId: string;
  descriptionOverride?: string;
  snapshotOverride?: string;
}
```

**NormalizedAccount** — add:
- `cohortsById: Record<string, LearningCohort>`
- `cohortAssignments: CohortAssignment[]`
- `employeeEntityOverrides: EmployeeEntityOverride[]`

**AccountEmployee** — add:
- `cohortIds?: string[]` (convenience, derived from assignments)

### 2. Update Parser (`src/lib/accountParser.ts`)

- Parse `cohorts`, `cohortAssignments`, `employeeEntityOverrides` from uploaded JSON
- Default to empty arrays/maps when not present
- Parse `description` and `snapshotText` on roles

### 3. Update Selectors (`src/lib/accountSelectors.ts`)

- `getEmployeeCohorts(acct, employeeId)` → cohorts the employee is a member of
- `getManagedCohorts(acct, employeeId)` → cohorts the employee manages
- `getRoleForEmployee(acct, employeeId)` → role with user-level override applied
- `getProjectsForEmployee(acct, employeeId)` → projects with user-level overrides
- `getCohortProgress(acct, cohortId)` → aggregated progress across members

### 4. Update Profile Data Generator (`src/lib/profileDataGenerator.ts`)

- Use `role.snapshotText` or `role.description` (truncated) for `roleSnapshotText` instead of just counting skills
- Apply `employeeEntityOverrides` when generating snapshot text
- Generate project snapshot from project descriptions
- Add cohort names to profile data

### 5. Update My360 (`src/pages/My360.tsx`)

- **Role Snapshot card**: Use role description (override if exists). "Explore" opens full description
- **Project Snapshot card**: Show project(s) with descriptions. Multiple projects listed
- **New: Cohorts section** — show cohorts the user belongs to with progress bars and skill target counts
- **Skills & Gap filter**: Already supports "Role" / "Project" toggle — no change needed

### 6. Update SkillGapEntry source type

- Extend `source: "role" | "project"` → `"role" | "project" | "cohort"` for future cohort-based gap analysis

### 7. Stub Data Structure

All new fields default to empty so existing accounts work unchanged. The user will populate:
- Skills and proficiency per user, role, project
- Role/project/cohort details and assignments
- User-level overrides

---

### Key Principle

Role, Project, and Cohort are **top-level entities** in `NormalizedAccount`. Changes to these entities affect all assigned users. But `employeeEntityOverrides` allows user-level customization (descriptions, snapshots) that stays confined to that user. Cohort progress is always per-user via `CohortAssignment.progress`.

### Files Modified

| File | Change |
|---|---|
| `src/types/account-v2.ts` | Add LearningCohort, CohortAssignment, EmployeeEntityOverride; extend AccountRole, NormalizedAccount |
| `src/lib/accountParser.ts` | Parse new entities from JSON |
| `src/lib/accountSelectors.ts` | New selectors for cohorts, overridden role/project data |
| `src/lib/profileDataGenerator.ts` | Use descriptions + overrides for snapshots |
| `src/pages/My360.tsx` | Cohorts section, richer role/project snapshots |
| `src/lib/accountFallbacks.ts` | Default empty values for new fields |

