

## Fix: Navigation items missing on first login for admin users

### Root Cause

In `AppSidebar.tsx`, the nav filter at line 124 checks `item.roles.includes(user.role)`. On first login as an admin user, `user.role` is `"admin"` and `viewMode` is `"me"`. The learner-mode items ("New Chat", "AI Manager") require `roles: ["learner"]`, so they're filtered out. Only "Learning Spaces" (which includes `"admin"` in its roles) shows up.

When toggling to Team and back to Me, `setRole("learner")` is called, changing `user.role` to `"learner"` — which then passes the filter.

### Fix

Change the `filteredItems` logic to derive an **effective role** from `viewMode` instead of relying on `user.role`:
- `viewMode === "me"` → treat as `"learner"` for filtering purposes
- `viewMode === "team"` → treat as `"manager"` (or `"admin"` if user is admin)

**File:** `src/components/layout/AppSidebar.tsx` (~line 124)

```typescript
const effectiveRole = viewMode === "me" ? "learner" : user.role === "admin" ? "admin" : "manager";

const filteredItems = navItems.filter((item) => {
  if (!item.roles.includes(effectiveRole)) return false;
  // ... rest of filtering unchanged
});
```

This ensures admin users in "me" mode see all learner nav items immediately on first login.

### Files Modified
- `src/components/layout/AppSidebar.tsx`

