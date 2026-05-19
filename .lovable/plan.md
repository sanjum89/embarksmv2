## Sidebar + Settings cleanup

### 1. Remove "Super Light" and "Theme" entries from the sidebar

Both now live in Settings, so the duplicates at the bottom of the sidebar are noise.

- In `src/components/layout/AppSidebar.tsx`:
  - **New sidebar block (~lines 372–405):** delete the entire "Theme style switcher" Popover. Keep the existing dark/light `toggleTheme` button above it — the user only asked to remove "Super light" and "Theme", and the new sidebar has no Super Light cycle.
  - **Traditional sidebar block (~lines 708–743):** replace the Super-Light/Light/Dark cycle button with a simple dark↔light toggle that mirrors the new sidebar (no `superLight` / `setSuperLight` references).
  - **Traditional sidebar block (~lines 745–782):** delete the "Theme style switcher" Popover wholesale.
  - Drop unused imports/destructures (`superLight`, `setSuperLight`, `setStyleTheme`, `isTraditional`, `Palette`) if they are no longer referenced anywhere else in the file.

### 2. Move "Settings" below "Accessibility"

- In `src/components/layout/AppSidebar.tsx`:
  - Remove `{ label: "Settings", path: "/settings", icon: SettingsIcon }` from both `meNavItems` and `teamNavItems` (they currently appear in the top nav alongside Embark AI / Role Play / etc.).
  - Add a Settings link in the bottom section of **both** sidebar layouts, rendered immediately after the Accessibility entry. Use the same button styling as Accessibility (full row when expanded, round icon when collapsed, tooltip on hover when collapsed). Active route highlighting matches the other bottom-section entries.

### 3. Filter "Active sessions" in Settings to current user + their direct reports

Today `AboutSection` shows every signed-in user globally. That leaks an Admin session (e.g. Rathbones Admin) into a learner's Settings page, which is what Julian is seeing.

- In `src/pages/Settings.tsx` `AboutSection`:
  - Read `normalizedAccount` from `useAccount()` to get `hierarchyMap` and `usersById`.
  - Build the set of allowed employee IDs:
    - Always include the current user's `linkedEmployeeId` (fallback to `user.id`).
    - Walk `hierarchyMap` starting from that employee ID to collect **all descendants** (direct reports + their reports, recursively). This matches how Manager scopes are already defined elsewhere in the app and keeps the behaviour correct for multi-level managers, while still collapsing to "self only" for a pure learner like Julian.
  - For each signed-in user, resolve their `linkedEmployeeId` via `usersById` and keep them only if that ID is in the allowed set. Always keep the current user themselves even if their account record is missing.
  - Render the filtered list. If the only result is the current user, label the section "Your session" (singular) instead of "Active sessions" to make the empty-team case feel intentional.

Result: Julian (learner) sees only his own session; a manager sees themselves plus signed-in reports; an Admin still sees everyone in their subtree.

### Files to touch

- `src/components/layout/AppSidebar.tsx`
- `src/pages/Settings.tsx`

### Out of scope

- Touching `ThemeContext` (Super Light state stays available for the Settings UI to drive).
- Reworking the Settings page structure beyond the Active Sessions filter.
- Changing Admin-side session visibility (Admins continue to see their full reporting subtree, which already excludes other tenants).
