## Goal

Slim Team-mode sidebar to only the surfaces a manager actually uses today. Old admin/management screens are preserved (not deleted) by moving them under the **Dev** group as `(legacy)` so they remain reachable for reference and demos.

## Final Team-mode sidebar (flat, 5 items)

```
Team Home          /team                        ← renamed from "Team Mode"
Cohorts            /manager/cohorts             ← repurposed, see below
People Graph       /manager/people-graph
Action Centre      /action-centre
New Chat           /chat
```

My 360 is removed from Team mode (lives in Me mode only).

## Dev group additions (legacy, still reachable)

```
Admin (legacy)              /admin
Skill Targets (legacy)      /manager/skill-targets
Role Play Bank (legacy)     /manager/role-play
Program Context (legacy)    /manager/programs    ← new path for old ProgramContextPage
Team Insights (legacy)      /team-insights
Team Dashboard (legacy)     /team-dashboard
Manager View (legacy)       /manager
```

Existing routes are kept in `App.tsx`; we only add `/manager/programs` for the old ProgramContextPage so `/manager/cohorts` can be reused for the new Cohort Hub list.

## Cohorts entry — repurpose `/manager/cohorts`

Replace `ProgramContextPage` at `/manager/cohorts` with a new lightweight **`ManagerCohortPicker`** page:

- Calls `useAccountCohorts()` and renders one card per cohort linking to `/manager/cohort/:id` (the new Manager Cohort Hub with Roster heatmap + AI Changes + CPD).
- If the live list returns empty, falls back to a single card for the demo cohort `RATHBONES_COHORT_ID` so the manager can always reach the hub.
- Header: "Cohorts you manage — pick one to open the hub."

Old `ProgramContextPage` stays mounted at `/manager/programs` under the Dev group.

## TeamMode page resilience

In `src/pages/TeamMode.tsx`, when `cohorts.length === 0`, render a fallback card linking to `/manager/cohort/${RATHBONES_COHORT_ID}` so the demo cohort hub is always one click away.

## Admin gating

Keep "Admin (legacy)" visible only when `baseRole === "admin"` (so Julian — Investment Director — does not see it as a top-level item; he can still access via Dev if dev mode is on).

## Files to touch

- `src/components/layout/AppSidebar.tsx` — replace `teamNavItems`; move legacy entries into the Dev group with `(legacy)` labels.
- `src/pages/ManagerCohortPicker.tsx` *(new)* — cohort list with demo fallback.
- `src/App.tsx` — point `/manager/cohorts` → `ManagerCohortPicker`; add `/manager/programs` → `ProgramContextPage`.
- `src/pages/TeamMode.tsx` — empty-state fallback cohort card; rename heading to "Team Home".

## Out of scope

- My 360 changes for Julian (skipped per your call).
- Any data/DB changes.
- Internals of Manager Cohort Hub, Action Centre, Learner Drawer, AI Explain popover, `useManagerActions`.
