

## Plan: Fix Layout Issues and Merge Snapshots

### 1. Collapsible Sidebar
- Add `expanded` state to `AppSidebar` with a toggle button (e.g., `PanelLeftClose`/`PanelLeftOpen` icon)
- When expanded: `w-56` with icon + text labels; when collapsed: `w-16` icon-only (current)
- Update `AppLayout` to dynamically set `ml-16` or `ml-56` based on sidebar state
- Share state via prop or context so layout responds to sidebar toggle

### 2. Skills & Gap pills overflow fix
- The skill gap rows in `My360.tsx` (lines 296-333) use `min-w-[130px]` pills that overflow the card on narrow widths
- Change to `overflow-x-auto` on the container and reduce pill `min-w` values, or wrap pills better within the card boundaries

### 3. Reduce AI chat panel width
- In `My360.tsx` line 417: change `w-[360px]` to `w-[320px]`
- Same adjustment on `SkillTargetDetail.tsx` if applicable

### 4. Merge Role & Project Snapshot into single "Snapshot" card
- Replace the two separate snapshot cards (lines 229-271) with one card titled "Snapshot"
- Add a toggle pill strip with "Role" and "Project" options (similar to the Gap View / Action Plan toggle)
- Show role snapshot text when "Role" selected, project snapshot text when "Project" selected
- New state: `snapshotView: "Role" | "Project"` defaulting to "Role"

### Files to edit
- `src/components/layout/AppSidebar.tsx` — add expand/collapse toggle + expanded layout
- `src/components/layout/AppLayout.tsx` — dynamic margin based on sidebar state
- `src/pages/My360.tsx` — fix pills overflow, reduce chat width, merge snapshot cards

