

# Login / Logout for Profile Switcher

## What changes

### 1. Track signed-in users with localStorage persistence
- Store a `Set<string>` of signed-in user IDs in `UserContext`
- On mount, read from `localStorage` key `signedInUsers`
- On login/logout, update both state and localStorage
- Only signed-in users show the "Signed in" badge (currently all users show it)
- Only signed-in users can be switched to with a single click

### 2. Add "Login as different user" button to profile switcher popover
- Add a "Login as different user" button at the bottom of the profile switcher popover (both traditional and new UI variants)
- Clicking it opens a Dialog with:
  - A dropdown/select listing all `availableUsers` (showing name + title)
  - A password input field
  - A "Sign In" button
- Password validation: accept `workforceai` as the password
- On success: add user ID to signed-in set, switch to that user, close dialog
- On wrong password: show inline error

### 3. Add "Sign out" option for signed-in users
- In the profile switcher popover, each signed-in user (except the currently active one) gets a small logout icon button
- Clicking it removes them from the signed-in set
- If the active user signs out, switch to the first remaining signed-in user (or show login prompt if none left)

### 4. Change switcher behavior
- Users NOT signed in: shown grayed out, no click-to-switch, no "Signed in" badge
- Users signed in: shown normally with emerald "Signed in" badge, click to switch
- Active user: shown with check mark as today

### Files modified
- `src/contexts/UserContext.tsx` — add `signedInUserIds`, `loginUser(id)`, `logoutUser(id)` with localStorage persistence
- `src/components/layout/AppSidebar.tsx` — update both popover instances to show login/logout UI, add login dialog

### No new pages or routes needed

