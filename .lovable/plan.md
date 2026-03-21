

## Plan: Dynamic Tag Pills Based on Visible Role Plays

### Problem
The tag pills are currently derived from **all** role plays regardless of the active tab, search query, or difficulty filter. They should only show tags that exist on the currently visible role plays.

### Change

**`src/pages/RolePlayBank.tsx`**

Update the `allTags` useMemo (lines 68-72) to derive tags from role plays filtered by tab, search, and difficulty — but **not** by the selected tag itself (to avoid tags disappearing once you click one).

Specifically:
- Compute a "pre-tag filtered" list: apply `activeTab`, `search`, and `difficulty` filters but skip the `selectedTag` filter
- Collect tags only from that subset
- This means switching tabs, searching, or changing difficulty will dynamically update which tag pills appear
- If a selected tag no longer exists in the filtered set, auto-clear it

