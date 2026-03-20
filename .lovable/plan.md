

## Fix: Role Selector Bug + Shield Icons for Manager/Admin

### Problem
When selecting a role (e.g., Admin) for one user in the profile selection step, it visually appears to apply to all other checked users. This is likely caused by Radix Select portal conflicts when multiple Select components are rendered inside a ScrollArea without `position="popper"`.

### Changes

**1. Fix role Select portal issue (`src/components/account/AddAccountDialog.tsx`)**
- Add `position="popper"` and `className="z-[9999]"` to each `SelectContent` in the role dropdown (same fix pattern used elsewhere in the app for Select inside dialogs/scroll areas)

**2. Add differentiated shield icons for Manager vs Admin**
- After a user is checked and assigned a role, show a shield icon next to their name reflecting the **current selected role** (not just `hasDirectReports`):
  - **Admin**: `ShieldCheck` icon (filled/prominent, primary color)
  - **Manager**: `Shield` icon (outline, muted color)
  - **Learner**: No shield icon
- This replaces the current static `hasDirectReports` shield with a dynamic icon based on `roleMap[row.id]`

### Files Modified
- `src/components/account/AddAccountDialog.tsx`

