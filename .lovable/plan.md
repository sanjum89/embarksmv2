## Goal
Two small sidebar changes in `src/components/layout/AppSidebar.tsx`:

1. Move the **Legacy** group out of the main nav lists and render it in the bottom utility section, **just below the Branding button** (above the Dev/EOL Mode toggle).
2. Rename the **EOL Mode** toggle to **Dev Mode**, and remove the `(Legacy)` suffix from Dev-Mode-related items (Dev Tools stays a Dev Mode tool, not Legacy).

## Changes

### 1. Pull Legacy out of `meNavItems` / `teamNavItems`
- Remove the `Legacy` entries (currently the last item in both `meNavItems` and `teamNavItems`).
- Drop **Dev Tools (Legacy)** from the team Legacy list entirely — it belongs with Dev Mode, not Legacy.
- Define two module-level arrays the bottom panel can render:
  ```ts
  const legacyMeItems = [
    { label: "Learning Spaces (Legacy)", path: "/dashboard", icon: LayoutDashboard },
    { label: "Skill Targets (Legacy)",   path: "/dashboard", icon: Target },
    { label: "My 360 (Legacy)",          path: "/my-360-legacy", icon: CircleUser },
  ];
  const legacyTeamItems = [
    { label: "Admin (Legacy)",           path: "/admin", icon: Shield },
    { label: "Skill Targets (Legacy)",   path: "/manager/skill-targets", icon: Target },
    { label: "Role Play Bank (Legacy)",  path: "/manager/role-play", icon: Drama },
    { label: "Program Context (Legacy)", path: "/manager/programs", icon: Building2 },
    { label: "Team Dashboard (Legacy)",  path: "/team-dashboard", icon: LayoutDashboard },
    { label: "Team Insights (Legacy)",   path: "/team-insights", icon: BarChart3 },
    { label: "Manager View (Legacy)",    path: "/manager", icon: UsersRound },
    { label: "My 360 (Legacy)",          path: "/my-360-legacy", icon: CircleUser },
  ];
  ```
- The active legacy list comes from `viewMode === "me" ? legacyMeItems : legacyTeamItems`.

### 2. Render a Legacy entry below Branding
In both theme blocks (traditional ~line 439, standard ~line 817), insert a new bottom-section element directly after the Branding button and before the Dev/EOL toggle. Gate it on `devMode` so it only appears when Dev Mode is on.

- **Expanded sidebar**: render a collapsible button labeled **Legacy** with the `Archive` icon and a chevron, using existing `legacyOpen` state. When open, render the corresponding `legacyMeItems` / `legacyTeamItems` as indented `NavLink`s, mirroring the styling already used for nested children in the nav area.
- **Collapsed sidebar**: render a single icon button (Archive) inside a Tooltip + Popover that lists the legacy items, matching how Branding/Theme already handle the collapsed state.

Remove the now-unused `Legacy` branch from the in-nav `children` rendering path. Keep `legacyOpen` state; drop the `getGroupOpen` / `toggleGroupByLabel` `"Legacy"` branches since Legacy no longer flows through `filteredItems.map`.

### 3. Rename EOL Mode → Dev Mode
Replace all four user-facing strings:
- Traditional block (~lines 467, 480): `EOL Mode` → `Dev Mode`, tooltip `EOL Mode on/off` → `Dev Mode on/off`.
- Standard block (~lines 842, 855): same replacements.

Internal state name `devMode` and storage key `"dev-mode"` already match — no logic change.

### 4. `Dev Tools` item
Currently lives only inside the Legacy group with the `(Legacy)` suffix. Remove it from the Legacy list (per point 1). Dev Tools remains reachable via its route `/dev-tools` (already a `dev: true` page). If you also want a sidebar entry for it under Dev Mode, that is a separate question (see open question).

## Out of scope
- Route changes, page renames
- Touching the underlying `dev-mode` localStorage key
- Memory doc `mem://style/eol-mode-rename` (will need a follow-up update once approved, but no code rule depends on the old name)

## Open question
Do you want a visible **Dev Tools** entry rendered in the sidebar when Dev Mode is on (e.g., right below the Legacy section), or is keeping it accessible only by URL fine?
