

## Dynamic Role Snapshot + Role-Driven Gap Analysis in My360

### Problem

1. **Role Snapshot card** shows static text baked into `profileData.roleSnapshotText` at generation time rather than dynamically reading from the role catalog
2. **Explore button** on Role Snapshot sends a hardcoded response about "Customer Support Executive L1" instead of the actual role's description
3. **Skills & Gap (Role filter)** uses `deriveGapsFromEmployee` which only iterates over the employee's own skills — role-required skills the employee doesn't possess are invisible. They should appear with a dotted-border pill, a hyphen for proficiency, and the expected target level shown.

### Changes

#### 1. `src/pages/My360.tsx` — Dynamic role snapshot and explore

- Import `normalizedAccount` (already available) and look up the employee's role via `normalizedAccount.rolesById[employee.roleId]`
- Replace `profileData.roleSnapshotText` with `role?.snapshotText` (falling back to profileData)
- Replace hardcoded `ROLE_EXPLORE_RESPONSE` with the role's `description` or `detailedDescription` from the catalog, formatted as markdown
- Remove the static `ROLE_EXPLORE_PROMPT` / `ROLE_EXPLORE_RESPONSE` constants (or keep as fallback for the default account)

#### 2. `src/lib/skillUtils.ts` — New combined gap function

Add a new function `deriveFullRoleGaps(employeeSkills, roleRequiredSkills)` that:
- Starts from the **role's required skills** as the baseline
- For each required skill, finds the employee's matching skill (if any)
- If the employee has the skill → compute gap as normal
- If the employee **doesn't** have the skill → return `currentLevel: null`, gap = difference from 0
- This produces `GapResult[]` entries with `currentLevel: null` for missing skills

Add a corresponding `deriveFullRoleRadar` that includes missing skills (score = 0).

#### 3. `src/pages/My360.tsx` — Use new gap function for Role filter

- When `gapSource === "Role"`, call `deriveFullRoleGaps` instead of `deriveGapsFromEmployee`
- When `gapSource === "Project"`, keep existing `deriveGapsFromEmployee` behavior

#### 4. `src/pages/My360.tsx` — Dotted-border pill for missing skills

In the Skills & Gap grid rendering, when `row.level === "—"` (null current level):
- Render the skill pill with `border-dashed border-muted-foreground/40` instead of a solid border
- Show `—` in the proficiency badge
- Target badge shows the required level as normal
- Gap label shows "High gap" or "Medium gap" as computed

#### 5. `src/lib/profileDataGenerator.ts` — Use role catalog for roleSkillsRequired

The generator already derives `roleSkillsRequired` from the role's `requiredSkills`. Verify this is consistent with the catalog IDs. No change needed here — the `rolesById` lookup already works.

### Technical Details

**New function signature in `skillUtils.ts`:**
```typescript
export function deriveFullRoleGaps(
  current: SkillEntry[],
  roleRequired: SkillRequirement[]
): GapResult[]
```

Iterates over `roleRequired`, looks up matching employee skill. Missing skills get `currentLevel: null` and gap computed from index -1 vs required index.

**Role lookup in My360:**
```typescript
const employee = normalizedAccount?.employeesById[user.id];
const role = employee?.roleId ? normalizedAccount?.rolesById[employee.roleId] : undefined;
```

### Files Modified

| File | Change |
|---|---|
| `src/lib/skillUtils.ts` | Add `deriveFullRoleGaps` and `deriveFullRoleRadar` functions |
| `src/pages/My360.tsx` | Dynamic role snapshot from catalog; use full role gap for Role filter; dotted-border pill for missing skills |

