

## Plan: Login to New UI + Account Switch Overlay

### Changes

**1. `src/components/layout/LoginPage.tsx`** — Force New UI + Super Light on login

After successful `loginUser()` call, set the theme to "new" and superLight to true:
- Import `useTheme` from ThemeContext
- After `loginUser(adminUser.id)` succeeds, call `setStyleTheme("new")` and `setSuperLight(true)`

**2. Account switch loading overlay**

Add a "Switching accounts..." overlay with a brief delay when switching between accounts.

- **`src/contexts/AccountContext.tsx`**: Add `switching` state (boolean) to context. In `switchAccount`, set `switching = true`, use `setTimeout` (~1.5s) before actually updating `activeAccountId`, then set `switching = false`.
- **`src/components/layout/AppLayout.tsx`**: Read `switching` from AccountContext. When true, render a full-screen overlay with "Switching accounts..." text and a subtle spinner/animation, blocking the main content underneath.

### Files Changed

| File | Change |
|------|--------|
| `src/components/layout/LoginPage.tsx` | Set styleTheme to "new" and superLight to true on login |
| `src/contexts/AccountContext.tsx` | Add `switching` boolean state, delay account switch by ~1.5s |
| `src/components/layout/AppLayout.tsx` | Show "Switching accounts..." overlay when `switching` is true |

No DB changes.

