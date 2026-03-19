

# Fix: Account Switcher Shows "Accounts" Instead of Active Account Name

## Problems

1. **"Accounts" shown instead of real name**: `AccountContext` initializes `accounts` as `[]` and loads them async from the database. During loading (and potentially after if there's a timing issue), `activeAccount` is `null` and `accounts[0]` is `undefined`, so `currentAccount` resolves to `null` and the text falls back to "Accounts".

2. **Crash risk on line 48**: `acct.id === activeAccount.id` in the popover will throw if `activeAccount` is null when the dropdown is opened.

3. **Signed-in users not persisting across refresh**: The `UserContext` persistence fixes from the earlier approved plan were implemented, but the `getUsers()` fallback to employees (for accounts like Rathbones that have no explicit `users` section) was not. This means Alex (from default mock data) shows instead of the uploaded account's employees.

## Changes

### 1. `src/components/account/AccountSwitcher.tsx`
- Show a loading skeleton (or the Building2 icon with no text) while `accounts.length === 0` (loading state)
- Use `activeAccount?.id` instead of `activeAccount.id` on line 48 to prevent crash

### 2. `src/contexts/UserContext.tsx` — Employee fallback in `getUsers()`
- When `normalizedAccount.usersById` is empty but `normalizedAccount.employeesById` has entries, map those employees into User objects with inferred roles (check `hierarchyMap` to determine managers vs learners)
- This ensures Rathbones and other uploaded accounts show their full employee list in the profile switcher

### 3. `src/contexts/AccountContext.tsx` — No changes needed
The loading/activeAccount logic is correct; the issue is downstream in AccountSwitcher not handling the loading state.

## Files Modified

| File | Change |
|------|--------|
| `src/components/account/AccountSwitcher.tsx` | Handle loading state; fix null safety on activeAccount |
| `src/contexts/UserContext.tsx` | Add employee-to-user fallback in `getUsers()` |

