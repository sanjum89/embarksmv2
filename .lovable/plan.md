

# Normalized Multi-Account Architecture Refactor

## Overview

Refactor the data layer from a flat JSONB blob (`AccountData`) to a normalized entity model with derived selectors. Keep all existing pages, components, layouts, and styling intact — only change how data flows into them.

## Current State

- `AccountContext` already supports multi-account switching, add, delete
- `AccountData` is a flat blob: employees, skillTargets, rolePlays, assessments, learningModules, newHires, programContexts, teamMembers, profileData
- Users and employees are conflated (same `User` type)
- Projects are embedded inside employee profile text, not first-class entities
- Pages read from context hooks (`useUser`, `useSkillTargets`, `useAccount`) — some still import mock data directly

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  Upload JSON  →  parse & validate  →  normalize │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│           AccountStore (React Context)          │
│                                                 │
│  accountsById: Record<id, NormalizedAccount>    │
│  activeAccountId: string                        │
│  ─────────────────────────────────────────────  │
│  Normalized entities per account:               │
│    usersById, employeesById, rolesById,         │
│    projectsById, projectAssignments,            │
│    hierarchyMap, skillTargets, rolePlays,       │
│    assessments, modules, proficiencyScale,      │
│    branding, prompts, aiContext, pageData,       │
│    my360, reflections, workSignals              │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│        Selector / Service Layer (pure fns)      │
│  getActiveAccount, getCurrentUser,              │
│  getDirectReports, getEmployeeProjects,         │
│  getRoleGap, getProjectGap, getCombinedGap,     │
│  getAccountBranding, getAdminOrgSummary, ...    │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  Existing Pages (unchanged layout/UI)           │
│  Dashboard, My360, ManagerView, TeamInsights,   │
│  AIManager, SkillTargets, RolePlay, Admin       │
│  → Read from selectors, not raw data            │
└─────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: New Type System (~3 files)

**`src/types/account-v2.ts`** — Define all normalized entity types:

- `NormalizedAccount` — top-level container with entity maps
- `AccountBranding` — name, logo, accentColor, copy
- `ProficiencyScale` — labeled levels with order (supports custom scales)
- `AccountUser` — app persona (id, name, email, role, linkedEmployeeId)
- `AccountEmployee` — workforce record (id, name, title, department, skills, roleId, reportsTo)
- `AccountRole` — role catalog entry (id, name, requiredSkills)
- `AccountProject` — first-class project (id, name, description, managerIds, requiredSkills, status, metadata)
- `ProjectAssignment` — many-to-many (employeeId, projectId)
- `AccountPrompts`, `AccountAIContext`, `AccountPageData`, `AccountMy360Data`, `AccountReflection`, `AccountWorkSignal`
- Keep existing `SkillTarget`, `RolePlay`, `Assessment`, `LearningModule` types as-is

### Phase 2: JSON Parser & Normalizer (~2 files)

**`src/lib/accountParser.ts`**:
- `parseAccountJSON(raw: unknown): NormalizedAccount` — validates top-level sections, normalizes into entity maps
- Schema version check (v1 assumed if missing)
- Required sections: `account` (name), `users` or `employees`
- Optional sections: everything else — missing sections get fallback generation
- Build `hierarchyMap` from employee `reportsTo` fields
- Build `projectAssignments` from explicit assignment array or employee.projectIds

**`src/lib/accountFallbacks.ts`**:
- `generateFallbacks(partial: Partial<NormalizedAccount>): NormalizedAccount`
- Fill missing sections with empty collections (not demo data)
- Generate lightweight pageData stubs from available employees/roles/projects

### Phase 3: Selector / Service Layer (~1 file)

**`src/lib/accountSelectors.ts`** — Pure functions taking `NormalizedAccount` as input:

- `getAccountBranding(acct)` → branding object
- `getUserById(acct, id)` / `getEmployeeById(acct, id)`
- `getCurrentEmployee(acct, userId)` — resolves user→employee link
- `getDirectReports(acct, employeeId)` → employee[]
- `getFullReportingTree(acct, employeeId)` → employee[]
- `getEmployeeProjects(acct, employeeId)` → project[]
- `getProjectMembers(acct, projectId)` → employee[]
- `getRoleByEmployee(acct, employeeId)` → role
- `getEmployeeRoleGap(acct, employeeId)` → gap[] (employee skills vs role required)
- `getEmployeeProjectGap(acct, employeeId, projectId)` → gap[]
- `getCombinedGap(acct, employeeId)` → merged gap[]
- `getAdminOrgSummary(acct)` → org-wide stats
- `getManagerTeamSummary(acct, managerId)` → team stats
- `getLearnerHomeData(acct, userId)` → dashboard data

### Phase 4: Migrate AccountContext (~1 file)

**`src/contexts/AccountContext.tsx`**:
- Change internal state from `Account[]` to `Record<string, NormalizedAccount>`
- `addAccount` now calls `parseAccountJSON` + `generateFallbacks`
- Default "Cornerstone Demo" account built via a `buildDefaultNormalized()` that maps existing mock data into the new normalized shape
- Expose `activeNormalizedAccount` alongside existing `activeAccount` for backward compat during migration
- Expose key selectors as convenience hooks or keep them as importable functions

### Phase 5: Migrate Default Account Data (~1 file)

**`src/lib/accountDefaults.ts`**:
- Add `buildDefaultNormalized(): NormalizedAccount` that maps existing mock data into normalized entities
- Create explicit `AccountRole` entries from existing profile data
- Create explicit `AccountProject` entries from embedded project references (e.g., "Apple Support Program", "WFAI Onboarding")
- Create `ProjectAssignment` records from existing employee→program relationships
- Map existing `profileDataByUser` into employee skills + my360 data

### Phase 6: Wire Pages to Selectors (~8-10 files, minimal changes each)

For each page, replace direct mock imports or raw `activeAccount.data.*` access with selector calls:

- **Dashboard.tsx** — already reads from `useSkillTargets()`, minimal change
- **My360.tsx** — replace `profileDataByUser` lookup with `getCurrentEmployee` + gap selectors
- **ActionPlanView.tsx** — same as My360
- **ManagerView.tsx** — replace `mockNewHires`, `mockProgramContexts` with account data
- **TeamInsights.tsx** — use `getDirectReports` / `getManagerTeamSummary`
- **AIManager.tsx** — use `aiContext` from account if available
- **SkillTargetsContext.tsx** — already account-aware, just point to normalized data
- **RolePlayContext.tsx** — already account-aware
- **UserContext.tsx** — map `AccountUser[]` from normalized account, preserve user↔employee separation

### Phase 7: Upload Validation & Feedback (~1 file)

**`src/components/account/AddAccountDialog.tsx`**:
- After JSON parse, run `parseAccountJSON` which validates structure
- Show validation errors for missing required sections
- Show warnings for missing optional sections (with fallback notice)
- Preview account name + employee count before confirming

## JSON Upload Schema (for reference)

```json
{
  "schemaVersion": "1",
  "account": { "name": "Acme Corp", "logo": "...", "accentColor": "#FF5500" },
  "proficiencyScale": ["Beginner", "Intermediate", "Advanced", "Expert", "Master"],
  "users": [
    { "id": "u1", "name": "...", "email": "...", "role": "manager", "linkedEmployeeId": "e1" }
  ],
  "employees": [
    { "id": "e1", "name": "...", "title": "...", "roleId": "r1", "reportsTo": null, "skills": [...] }
  ],
  "rolesCatalog": [
    { "id": "r1", "name": "Sales Manager", "requiredSkills": [...] }
  ],
  "projects": [
    { "id": "p1", "name": "...", "requiredSkills": [...], "managerIds": ["e1"] }
  ],
  "projectAssignments": [
    { "employeeId": "e2", "projectId": "p1" }
  ],
  "hierarchy": { ... },
  "skillTargets": [...],
  "rolePlays": [...],
  "prompts": { ... },
  "aiContext": { ... },
  "my360": { ... },
  "pageData": { ... }
}
```

## What does NOT change

- All page layouts, components, navigation, styling
- Sidebar structure, profile switcher, theme system
- Role play session, assessment page, learning module page UI
- Edge functions (chat, role-play-chat, content-search)
- Supabase storage schema (accounts table keeps JSONB, just stores normalized shape)
- No real auth, no real backend changes

## Files created/modified summary

| File | Action |
|------|--------|
| `src/types/account-v2.ts` | Create — normalized entity types |
| `src/lib/accountParser.ts` | Create — JSON parse + validate + normalize |
| `src/lib/accountFallbacks.ts` | Create — fallback generation for missing sections |
| `src/lib/accountSelectors.ts` | Create — derived selector functions |
| `src/lib/accountDefaults.ts` | Modify — add `buildDefaultNormalized()` |
| `src/contexts/AccountContext.tsx` | Modify — use normalized store internally |
| `src/contexts/UserContext.tsx` | Modify — separate user from employee |
| `src/contexts/SkillTargetsContext.tsx` | Minor — point to normalized skillTargets |
| `src/contexts/RolePlayContext.tsx` | Minor — point to normalized rolePlays |
| `src/components/account/AddAccountDialog.tsx` | Modify — validation feedback |
| `src/pages/My360.tsx` | Modify — use selectors |
| `src/components/my360/ActionPlanView.tsx` | Modify — use selectors |
| `src/pages/ManagerView.tsx` | Modify — use account data instead of mock imports |
| `src/pages/TeamInsights.tsx` | Modify — use selectors |
| `src/types/account.ts` | Keep for backward compat, deprecate gradually |

## Estimated scope

- ~4 new files (types, parser, fallbacks, selectors)
- ~10 modified files (context + pages)
- No new pages, no new UI components, no redesign

