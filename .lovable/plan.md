## Goal
Group the `dev: true` items in the sidebar (Me + Team lists) under a single collapsible **Legacy** parent, and normalize their labels so each one ends with `(Legacy)`.

## Scope
File: `src/components/layout/AppSidebar.tsx` only. No route changes, no other components.

## Changes

### 1. Restructure `meNavItems`
Keep top-level entries (Embark AI, Embark AI v2, New Chat, Role Play, Action Centre, Cohort Hub, My 360). Move the three `dev:true` items into a new `Legacy` group:

```ts
{
  label: "Legacy",
  path: "#legacy-me",
  icon: Archive, // or History
  dev: true,
  children: [
    { label: "Learning Spaces (Legacy)", path: "/dashboard", icon: LayoutDashboard, dev: true },
    { label: "Skill Targets (Legacy)",   path: "/dashboard", icon: Target, dev: true },
    { label: "My 360 (Legacy)",          path: "/my-360-legacy", icon: CircleUser, dev: true },
  ],
}
```

### 2. Restructure `teamNavItems`
Keep the non-dev entries at the top level. Move all `dev:true` entries (Admin, Skill Targets, Role Play Bank, Program Context, Team Dashboard, Team Insights, Manager View, My 360, Dev Tools) into the Legacy group, normalizing each label to end with `(Legacy)` (capital L, consistent casing — current labels use mixed `(legacy)` / `(Legacy)`):

```ts
{
  label: "Legacy",
  path: "#legacy-team",
  icon: Archive,
  dev: true,
  children: [
    { label: "Admin (Legacy)",           path: "/admin", icon: Shield },
    { label: "Skill Targets (Legacy)",   path: "/manager/skill-targets", icon: Target },
    { label: "Role Play Bank (Legacy)",  path: "/manager/role-play", icon: Drama },
    { label: "Program Context (Legacy)", path: "/manager/programs", icon: Building2 },
    { label: "Team Dashboard (Legacy)",  path: "/team-dashboard", icon: LayoutDashboard },
    { label: "Team Insights (Legacy)",   path: "/team-insights", icon: BarChart3 },
    { label: "Manager View (Legacy)",    path: "/manager", icon: UsersRound },
    { label: "My 360 (Legacy)",          path: "/my-360-legacy", icon: CircleUser },
    { label: "Dev Tools (Legacy)",       path: "/dev-tools", icon: Code },
  ],
}
```

Dev Tools — confirmed: include it in Legacy per "items now in the menu".

### 3. Wire the new group into existing collapsible logic
The sidebar already supports `children` via `learningSpacesOpen` / `managerOpen` state. Add a `legacyOpen` state (default **collapsed** so legacy items don't dominate the nav). Extend the `isLearningSpaces ? ... : ...` toggle branch to handle `Legacy` as a third group (use a small `getGroupState(label)` helper rather than nested ternaries). Apply this in both the traditional theme block and the standard theme block.

### 4. Visibility
Keep `dev: true` on the Legacy parent so the whole group only appears when Dev Mode is enabled — matches prior behavior and preserves the EOL Mode core rule. (If the user instead wants Legacy visible to all users, that's a one-line change — flagging as an open question.)

## Open question
Should the **Legacy** group be visible only in Dev/EOL Mode (current behavior of these items), or always visible to everyone? Default in the plan: Dev Mode only.

## Out of scope
- Renaming routes or moving pages
- Changing the dev-mode toggle behavior
- Touching `mem://style/eol-mode-rename` semantics