

## Problem Analysis

The sign-out feature works on the default Cornerstone account but fails on uploaded accounts (like Rathbone). The likely root cause is a **stale closure** in `logoutUser` — specifically, the `activeAccountId` and/or `users` captured in the `useCallback` may not reflect the current Rathbone account state at the time logout is invoked.

When `persistIds` is called with a stale/null `activeAccountId`, the updated signed-in list is either saved to the wrong localStorage key or not saved at all. On re-render, the component reads stale data, causing all users to appear logged out.

## Plan

### 1. Use refs for stable values in `logoutUser` (UserContext.tsx)

Add `useRef` for `activeAccountId` and `users` so the logout callback always reads the latest values instead of relying on closure captures:

- Add `activeAccountIdRef` and `usersRef` refs, kept in sync via `useEffect`
- In `logoutUser`, read from refs instead of closure variables
- This eliminates any stale closure issues regardless of React render timing

### 2. Simplify logout state update logic

Refactor `logoutUser` to avoid the nested `setTimeout` + `setSignedInUserIds` pattern which is fragile:

- Compute the updated list and next active user in a single synchronous flow
- Use functional update for `setSignedInUserIds` and call `setUser` directly after
- Persist using the ref-based `activeAccountId`

### Technical Details

**File: `src/contexts/UserContext.tsx`**

```typescript
// Add refs
const activeAccountIdRef = useRef(activeAccountId);
const usersRef = useRef(users);

useEffect(() => { activeAccountIdRef.current = activeAccountId; }, [activeAccountId]);
useEffect(() => { usersRef.current = users; }, [users]);

const logoutUser = useCallback((userId: string) => {
  const currentAccountId = activeAccountIdRef.current;
  const currentUsers = usersRef.current;
  
  setSignedInUserIds((prev) => {
    const updated = prev.filter((id) => id !== userId);
    persistIds(currentAccountId, updated);
    
    // If logging out the active user, switch to next available
    if (user.id === userId && updated.length > 0) {
      const next = currentUsers.find((u) => u.id === updated[0]);
      if (next) setUser(next);
    }
    return updated;
  });
}, [user.id]); // minimal deps since we use refs
```

