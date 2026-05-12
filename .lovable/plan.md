## What's missing

`src/pages/CohortHub.tsx` (456 lines, learner-facing) and its hook `useCohortHub` are built and the import line `import CohortHub from "./pages/CohortHub";` is present in `src/App.tsx` — but:

1. **No `<Route>` registers it.** `App.tsx` only routes `ManagerCohortHub` (`/manager/cohort/:cohortId`) and `ManagerCohortPicker` (`/manager/cohorts`). The learner page never mounts.
2. **No sidebar link points to it.** The "Me" nav in `src/components/layout/AppSidebar.tsx` (lines 54–68: Embark AI, New Chat, Dashboard parent, Action Centre, My 360) has no Cohort Hub entry.

That's why you can't find it.

## Plan

### 1. Register the route
In `src/App.tsx`, add inside the existing `<Routes>` block (next to other learner routes like `/my-360`):

```text
<Route path="/cohort" element={<CohortHub />} />
```

No params — `CohortHub` already resolves the active cohort from the logged-in employee via `useCohortHub({ accountId, employeeId, employeesById })`.

### 2. Add the Me-mode sidebar link
In `src/components/layout/AppSidebar.tsx`, add to the Me nav array (right after Action Centre / before My 360 reads naturally):

```text
{ label: "Cohort Hub", path: "/cohort", icon: Users }
```

Use `Users` (or `Users2` / `UsersRound`) from lucide-react — pick whichever isn't already used in the Me section to keep icons distinct.

### 3. Empty-state behaviour (already handled)
`CohortHub` already renders a friendly "You're not enrolled in an active cohort yet" message when `data.cohort` is null, so learners without a cohort won't see a broken page.

### 4. Quick spot-check
Switch to a Rathbones learner persona (Clara `rb-l6` is enrolled in `cohort.assoc_im.2026_01`) → sidebar shows Cohort Hub → click → page renders sessions / study groups / peers / mentor cards. Switch to a learner with no cohort → empty state copy.

## Out of scope

- Re-designing the Cohort Hub page itself.
- Adding it to the Manager nav (managers already have `/manager/cohorts` → `/manager/cohort/:id`).
- Renaming it.

## Technical notes

Files touched: `src/App.tsx` (one route line), `src/components/layout/AppSidebar.tsx` (one nav entry + icon import). Two small edits, no data, hook, or backend changes.
