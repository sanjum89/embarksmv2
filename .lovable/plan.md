

# Profile Switcher: Mode Toggle + Title Subtitle

## Changes

### 1. Add `title` field to `User` type (`src/types/learning.ts`)
Add an optional `title?: string` field to the `User` interface.

### 2. Add titles to mock users (`src/data/mock.ts`)
- Alex Rivera: `"Product Manager"` 
- Maya Thompson: `"Apple L1 Customer Support Executive"`
- Marcus Wellington: `"Regional Training Manager"` (or similar from existing data)
- Raj Patel: `"Apple L1 Customer Support Executive"`

### 3. Add `setRole` to profile switcher + show titles (`src/components/layout/AppSidebar.tsx`)

**Both theme variants** — in the profile switcher popover:

- Show each user's `title` as a subtitle line under their name (muted, smaller text)
- For users whose role is `"manager"` (Alex and Marcus — managers who can also view as learner), add a **Learner / Manager mode toggle** section. When switching to a manager user, show two sub-options:
  - "As Learner" → `switchUser(id)` + `setRole("learner")` → navigates to `/`
  - "As Manager" → `switchUser(id)` + `setRole("manager")` → navigates to `/manager`

- For pure learner users (Maya, Raj), clicking just switches directly as today.

**In the sidebar user info area** (bottom), show `user.title` as subtitle instead of `user.role`.

### 4. Update `UserContext` — expose `setRole` in switcher
Already available via `useUser()` — just need to destructure `setRole` in `AppSidebar`.

### 5. Determine which users are "manager-capable"
Add an optional `canManage?: boolean` field to `User`, or simply check if the user appears in a managers list. Simplest: add `canManage: true` to Alex and Marcus in mock data. When `canManage` is true, the switcher shows the Learner/Manager toggle.

## UI Behavior
- Profile switcher popover shows user list with name + title subtitle
- Manager-capable users (Alex, Marcus) show an expandable section or two clickable rows: one for Learner mode, one for Manager mode
- Current active mode gets the checkmark
- Sidebar bottom user info shows title instead of role

