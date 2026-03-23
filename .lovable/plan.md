

## Plan: Add Team Dashboard for All Managers

Create a new "Team Dashboard" page accessible to all managers in Team mode. It reuses the admin panel components (People Graph, Learning & Skills, Work Signals, Reflections) but scopes data to the logged-in manager's reporting tree instead of the entire organization.

### New file: `src/pages/TeamDashboard.tsx`

- Tabbed layout matching Admin Dashboard style (Overview, People Graph, Learning & Skills, Work Signals, Reflections)
- Accept `normalizedAccount` from context, but filter all data through the manager's reporting subtree
- Create a scoped copy of the account where `employeesById`, `namedEmployees`, `peopleGraph`, `signals`, `reflections`, `workSignals`, and `orgOverview` only contain employees in the manager's subtree
- Pass this filtered account to existing panel components: `OrgOverviewPanel`, `PeopleGraphPanel`, `LearningSkillsPanel`, `WorkSignalsPanel`, `ReflectionsPanel`
- Header shows: "Team Dashboard — {manager name}'s Team ({count} members)"

### New helper: `src/lib/accountSelectors.ts`

- Add `getScopedAccount(account, managerId)` function that:
  1. Gets all recursive reports via `getTeamMembers` (already exists in `accountHierarchy.ts`)
  2. Filters `employeesById` to only those IDs
  3. Filters `namedEmployees`, `peopleGraph`, `signals`, `reflections` by employee IDs
  4. Re-derives `orgOverview` and `learningAndSkills` from the scoped employee set
  5. Returns a new `NormalizedAccount` with scoped data

### Navigation: `src/components/layout/AppSidebar.tsx`

- Add "Team Dashboard" nav item under the manager group children (between "Team Insights" and existing items), with `BarChart3` or `Shield` icon
- Path: `/team-dashboard`
- Visible in team mode for `manager` and `admin` roles

### Routing: `src/App.tsx`

- Add route: `/team-dashboard` → `TeamDashboard`

### Existing panels — no changes needed

`OrgOverviewPanel`, `PeopleGraphPanel`, `LearningSkillsPanel`, `WorkSignalsPanel`, `ReflectionsPanel` already accept an `account` prop. By passing a scoped account, they render correctly without modification.

### Files changed

| File | Change |
|------|--------|
| `src/pages/TeamDashboard.tsx` | New page — tabbed team dashboard scoped to manager's reports |
| `src/lib/accountSelectors.ts` | Add `getScopedAccount()` helper |
| `src/components/layout/AppSidebar.tsx` | Add "Team Dashboard" to manager nav group |
| `src/App.tsx` | Add `/team-dashboard` route |

