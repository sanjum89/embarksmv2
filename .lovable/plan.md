

# Plan: Persona-Based Profile Switching

## Core Concept
Manager and learner logins are distinct persona types. All managers share the same manager experience; all learners share the same learner experience. Me/Team toggle switches the **same user's** role — not their identity.

## Changes

### 1. Profile Switcher Logic (`src/components/layout/AppSidebar.tsx`)

**Current behavior (broken):** Switching user always forces `setRole("learner")` and navigates to `/`.

**New behavior:**
- When switching to a `canManage` user: preserve current `viewMode` (if in "team" mode, stay in manager mode and navigate to `/manager`; if in "me" mode, stay in learner mode at `/`)
- When switching to a non-`canManage` user: always set to learner mode, navigate to `/`, and reset `viewMode` to `"me"`
- This applies to **both** Traditional and New UI profile popovers (lines ~390 and ~681)

### 2. Me/Team Toggle Clarification
Already correct — toggles the **current user's** role between learner/manager. No identity change. No modifications needed.

### 3. No data/mock changes needed
User personas and `canManage` flags are already correct.

## Files Modified
- `src/components/layout/AppSidebar.tsx` — update `onClick` handlers in both profile switcher popovers (2 locations)

