

# Architecture Extension Plan: Full Dataset Support + Admin/Team UI

## Overview

Extend the existing multi-account architecture to support 16 new data sections from client datasets, add strong types, update the parser, remove demo contamination for uploaded accounts, auto-generate profile data, and build 8 new admin/team UI panels — all wired through account-aware selectors.

## Technical Details

### Current State
- `NormalizedAccount` in `src/types/account-v2.ts` has 30+ fields but lacks: `header`, `companyProfile`, `siteProfile`, `siteRationale`, `architectureSources`, `architectureSignalCounts`, `signals`, `showcaseCases`, `explainability`
- `reflections` and `workSignals` are typed but no UI reads them
- `accountParser.ts` ignores the above sections
- `accountDefaults.ts` `generateFallbackData()` fills missing sections with Cornerstone demo data (skill targets, role plays, assessments, modules)
- 13 files import from `mock.ts` for fallback data
- `AdminView.tsx` is a placeholder
- No admin/team data visualization pages exist

---

## Phase 1 — Data Model + Parser (no UI changes)

### Step 1: Define new types
**File: `src/types/account-v2.ts`**

Add interfaces for all new sections:
- `AccountHeader` — dataset metadata (title, version, generatedAt, source)
- `CompanyProfile` — name, description, industry, founded, headquarters, scale, headcount, assetsUnderManagement
- `SiteProfile` — name, description, location, headcount, functions, statistics
- `SiteRationale` — reason, selectionCriteria, notes
- `ArchitectureSource` — id, name, type, description, signalTypes
- `ArchitectureSignalCount` — sourceId, signalType, count, period
- `NamedEmployeeRecord` — extends AccountEmployee with grade, level, shift, tenure, function, location, engagementScore, performanceRating, riskFlag, learningIndicators, workSignalIndicators
- `OrgOverviewData` — totalEmployees, managers, individualContributors, avgTenure, functions, roleDistribution, tenureBands, riskBands, summaryBlocks
- `PeopleGraphRow` — employeeId, name, role, level, tenure, grade, shift, learningIndicators, workSignalIndicators, engagementIndicators, performanceIndicators, labels, flags
- `EmployeeSignal` — id, employeeId, category, type, value, timestamp, source
- `ReflectionEntry` — id, employeeId, date, confidence, workload, sentiment, themes, managerFeedback, content
- `ReflectionSummary` — employeeId, avgConfidence, avgWorkload, sentimentTrend, topThemes, entries
- `WorkSignalCard` — category, title, metrics, flags, summary
- `WorkSignalMetric` — label, value, unit, trend, benchmark
- `WorkSignalFlag` — severity, label, description, employeeId
- `ShowcaseCase` — id, title, employeeId, employeeName, riskLabel, inputSignals, reasoningChain (AIReasoningStep[]), synthesis, recommendedActions
- `AIReasoningStep` — stepNumber, source, signal, interpretation, weight
- `ExplainabilityTrace` — employeeId, inputSignals, reasoningSteps, synthesizedOutput, confidence, recommendedCTAs
- `LearningAndSkillsSummary` — categoryTotals, completionCounts, avgScores, coverage, licenses, expiringLicenses, topSkillGaps, keyInsights, proficiencyDistribution, trendingCategories, criticalGaps
- `PerformanceAlert` — id, employeeId, type, severity, message, date
- `RecommendedCTA` — id, title, description, priority, targetEmployeeId, action

Add all these as optional fields on `NormalizedAccount`:
```
header?: AccountHeader
companyProfile?: CompanyProfile
siteProfile?: SiteProfile
siteRationale?: SiteRationale
architectureSources: ArchitectureSource[]
architectureSignalCounts: ArchitectureSignalCount[]
namedEmployees: NamedEmployeeRecord[]
orgOverview?: OrgOverviewData
peopleGraph: PeopleGraphRow[]
signals: EmployeeSignal[]
showcaseCases: ShowcaseCase[]
explainability: ExplainabilityTrace[]
learningAndSkills?: LearningAndSkillsSummary
performanceAlerts: PerformanceAlert[]
recommendedCTAs: RecommendedCTA[]
```

### Step 2: Update parser
**File: `src/lib/accountParser.ts`**

- Parse all new sections from uploaded JSON with flexible key matching (camelCase and snake_case)
- Map `namedEmployees` into both `employeesById` (existing) and `namedEmployees` (extended)
- Map `org` into `orgOverview`
- Map `signals` into `signals` array
- Map `showcaseCases` and `explainability` directly
- Add the new sections to optional section warnings list

### Step 3: Update fallbacks
**File: `src/lib/accountFallbacks.ts`**

- Add all new fields with empty array/undefined defaults
- Never inject demo data for any section

### Step 4: Remove demo contamination
**File: `src/lib/accountDefaults.ts`**

- Change `generateFallbackData()` to use empty arrays for `skillTargets`, `rolePlays`, `assessments`, `learningModules` instead of `defaults.xxx`
- Keep `buildDefaultNormalized()` unchanged (it's only for the Cornerstone Demo account)

### Step 5: Auto-generate profileData
**File: `src/lib/profileDataGenerator.ts`** (new)

- Function `generateProfileData(acct: NormalizedAccount): Record<string, ProfileData>`
- For each employee with skills, derive: title, manager name (from hierarchy), roleSkillsCurrent, roleSkillsRequired (from rolesById), projectSkillsCurrent/Required (from projects), summary text
- Called in parser when `profileData` is empty but employees have skills

### Step 6: Add selectors
**File: `src/lib/accountSelectors.ts`**

Add:
- `getHeader`, `getCompanyProfile`, `getSiteProfile`, `getSiteRationale`
- `getArchitectureSources`, `getArchitectureSignalCounts`
- `getOrgOverviewData` (return uploaded or derive from employees)
- `getPeopleGraphRows` (return uploaded or derive from namedEmployees)
- `getEmployeeSignals(acct, employeeId)`
- `getReflections(acct, employeeId?)`, `getReflectionSummary(acct, employeeId?)`
- `getWorkSignalsData(acct)`
- `getLearningAndSkillsData(acct)`
- `getShowcaseCases(acct)`
- `getExplainabilityTrace(acct, employeeId)`
- `getPerformanceAlerts(acct)`
- `getRecommendedCTAs(acct)`

### Step 7: Fix mock fallback imports
Replace hardcoded mock imports across these files with account-aware data:
- `My360.tsx` — remove `staticProfileData` import, use only `getProfileData`
- `ManagerView.tsx` — use `normalizedAccount.newHires` / `.programContexts`
- `ManagerRolePlay.tsx` — same
- `ProgramContextPanel.tsx` — same
- `TrainingAssignPanel.tsx` — same
- `CreateSkillTargetDialog.tsx` — use `normalizedAccount.learningModules`
- `SkillTargetBuilder.tsx` — use `normalizedAccount` modules/assessments/rolePlays
- `LearningModulePage.tsx` — use `normalizedAccount.learningModules`
- `TraditionalContentViewer.tsx` — use `normalizedAccount.assessments`

---

## Phase 2 — Admin/Team UI Pages

All new UI is rendered as tab panels within the existing `/admin` route, reusing the app's existing layout, card components, and design system.

### Step 8: Rebuild AdminView as tabbed dashboard
**File: `src/pages/AdminView.tsx`**

Replace placeholder with a tabbed layout:
- Tabs: Overview | People Graph | Learning & Skills | Work Signals | Reflections | AI Explainability

Each tab renders a dedicated panel component.

### Step 9: Company & Site Profile panel
**File: `src/components/admin/CompanyProfilePanel.tsx`** (new)

Renders company name, description, industry, founded, headquarters, scale, headcount. Shows site profile below if present. Shows site rationale. Shown at top of Overview tab.

### Step 10: Org Overview panel
**File: `src/components/admin/OrgOverviewPanel.tsx`** (new)

Summary cards: total employees, managers, ICs, avg tenure. Role distribution bar chart. Tenure bands. Risk bands. Function breakdown. Uses `getOrgOverviewData` selector.

### Step 11: People Graph panel
**File: `src/components/admin/PeopleGraphPanel.tsx`** (new)

Sortable/filterable table of all employees with columns: name, role, level, tenure, grade, learning indicators, work signal indicators, engagement, performance, flags. Uses `getPeopleGraphRows`. Clicking a row could navigate to employee detail (future).

### Step 12: Reflections panel
**File: `src/components/admin/ReflectionsPanel.tsx`** (new)

Aggregate view: avg confidence, avg workload, sentiment trend, top themes. Per-employee drill-down list. Uses `getReflections` / `getReflectionSummary`.

### Step 13: Work Signals panel
**File: `src/components/admin/WorkSignalsPanel.tsx`** (new)

Card grid for categories (productivity, compliance, customer experience, capacity). Each card shows metrics, flags, summary. Uses `getWorkSignalsData`.

### Step 14: Learning & Skills panel
**File: `src/components/admin/LearningSkillsPanel.tsx`** (new)

Category totals, completion counts, avg scores, coverage, license status, top skill gaps, proficiency distribution chart. Uses `getLearningAndSkillsData`.

### Step 15: AI Explainability panel
**File: `src/components/admin/ExplainabilityPanel.tsx`** (new)

- Architecture sources display
- Signal count summary
- Showcase cases list — each expandable to show: employee, risk label, input signals, step-by-step reasoning chain, synthesis narrative, recommended actions
- "Trace an employee" selector that shows the explainability trace for a chosen employee
- Uses `getShowcaseCases`, `getExplainabilityTrace`, `getArchitectureSources`

### Step 16: Performance Alerts & CTAs
Integrated into the Overview tab as a "Needs Attention" section showing `getPerformanceAlerts` and `getRecommendedCTAs` as actionable cards.

---

## Phase 3 — Wiring & Context Updates

### Step 17: Update AccountContext normalization
**File: `src/contexts/AccountContext.tsx`**

- Ensure `normalizeFromLegacy` passes new sections through to the normalized cache
- Call `generateProfileData` when profileData is empty

### Step 18: Update navigation
**File: `src/components/layout/AppSidebar.tsx`**

- Admin nav item already exists at `/admin` with `roles: ["admin"]`
- No route changes needed — all new UI lives under the existing `/admin` route as tabs

---

## Files Modified (existing)
- `src/types/account-v2.ts` — add ~20 new interfaces + extend NormalizedAccount
- `src/lib/accountParser.ts` — parse all new sections
- `src/lib/accountFallbacks.ts` — add new field defaults
- `src/lib/accountDefaults.ts` — fix `generateFallbackData` to stop injecting demo data
- `src/lib/accountSelectors.ts` — add ~16 new selectors
- `src/contexts/AccountContext.tsx` — wire profile generation + new sections
- `src/pages/AdminView.tsx` — rebuild as tabbed dashboard
- `src/pages/My360.tsx` — remove mock fallback
- `src/pages/ManagerView.tsx` — remove mock fallback
- `src/pages/ManagerRolePlay.tsx` — remove mock fallback
- `src/pages/SkillTargetBuilder.tsx` — use account modules
- `src/pages/LearningModulePage.tsx` — use account modules
- `src/components/manager/ProgramContextPanel.tsx` — remove mock fallback
- `src/components/manager/TrainingAssignPanel.tsx` — remove mock fallback
- `src/components/skill-target/CreateSkillTargetDialog.tsx` — use account modules
- `src/components/skill-target/TraditionalContentViewer.tsx` — use account assessments

## Files Created (new)
- `src/lib/profileDataGenerator.ts`
- `src/components/admin/CompanyProfilePanel.tsx`
- `src/components/admin/OrgOverviewPanel.tsx`
- `src/components/admin/PeopleGraphPanel.tsx`
- `src/components/admin/ReflectionsPanel.tsx`
- `src/components/admin/WorkSignalsPanel.tsx`
- `src/components/admin/LearningSkillsPanel.tsx`
- `src/components/admin/ExplainabilityPanel.tsx`

## Implementation Order
1. Types + parser + fallbacks + profile generator (foundation)
2. Selectors (data access layer)
3. Remove mock fallbacks across pages (isolation fix)
4. Admin tabbed dashboard + all panel components (UI)
5. Verify default Cornerstone account still works unchanged

