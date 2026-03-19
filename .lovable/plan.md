

# Add Sign Out for Active Signed-In Profile

## Problem
The sign-out button (LogOut icon) is conditionally hidden for the active user via `isSignedIn && !isActive`. The active profile only shows a checkmark but no way to sign out.

## Fix
In `src/components/layout/AppSidebar.tsx`, change both sidebar theme variants to show the sign-out button for ALL signed-in users, including the active one. Display both the check icon and the logout button side by side for the active signed-in user.

### Changes in `AppSidebar.tsx`
**Traditional theme (~line 490-498):**
- Change `isSignedIn && !isActive` to `isSignedIn` so the logout button appears for all signed-in users including the active one
- Show both the Check icon and LogOut button when `isActive && isSignedIn`

**New UI theme (~line 843-852):**
- Same change: `isSignedIn && !isActive` → `isSignedIn`

### Files modified
| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Show sign-out button for active profile in both theme variants |

