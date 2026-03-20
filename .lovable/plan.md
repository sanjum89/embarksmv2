

# Add Admin User to the Default Cornerstone Demo Account

## What Changes

Add a new admin persona to the default Cornerstone Demo account so there's a user who can access the Admin Dashboard tab and see org-wide data (employees, hierarchy, skills, reflections, work signals, performance).

## Plan

### Step 1: Add admin user to mock data
**File: `src/data/mock.ts`**

Add a new user constant:
```typescript
export const sarahAdmin: User = {
  id: "u11",
  name: "Sarah Chen",
  email: "sarah.chen@wfai.com",
  role: "admin",
  avatarUrl: "",
  title: "HR Director",
  canManage: true,
};
```

Add `sarahAdmin` to the `availableUsers` array.

### Step 2: Wire admin into default account
**File: `src/lib/accountDefaults.ts`**

- Import `sarahAdmin` from mock
- Add to `buildDefaultAccountData()` employees list with `reportsTo: null`
- Add to `reportsToMap` in `buildDefaultNormalized()`: `u11: null`
- Ensure `usersById` includes the admin user (already handled by iterating `defaultAvailableUsers`)

### Step 3: Generate sample admin-visible data for the default account
**File: `src/lib/accountDefaults.ts`** in `buildDefaultNormalized()`

Populate currently-empty arrays so the admin dashboard tabs have content:
- `reflections` — sample entries for existing employees (confidence, workload, sentiment, themes)
- `workSignals` — sample `WorkSignalCard` entries (productivity, compliance, capacity categories with metrics/flags)
- `namedEmployees` — derive from existing employees with added grade, level, tenure, shift, engagement/performance indicators
- `peopleGraph` — derive rows from named employees with flags
- `orgOverview` — summary stats (totalEmployees, managers, ICs, avgTenure, functions, summaryBlocks)
- `performanceAlerts` — a few sample alerts
- `recommendedCTAs` — a few sample action items
- `learningAndSkills` — summary with category totals, completion counts, coverage, top skill gaps

This gives the admin dashboard meaningful data to display when using the default account.

### Files Modified
- `src/data/mock.ts` — add `sarahAdmin` user + export in `availableUsers`
- `src/lib/accountDefaults.ts` — wire admin user + populate admin dashboard data arrays

### Files NOT Modified
- No UI changes needed — admin tabs already exist
- No parser/context changes needed
- No route changes needed

