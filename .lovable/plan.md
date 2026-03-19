

# Fix Imported Account Persona Handling + Post-Upload Profile Selection

## Problems Identified

1. **Auto-created users from employees**: `accountParser.ts` lines 99-112 automatically creates a user for EVERY employee when JSON has no `users` section. This floods the profile switcher with unwanted personas.
2. **Signed-in state not account-scoped**: `UserContext` stores a single flat `signedInUsers` array in localStorage. When switching accounts, the IDs don't correspond to the new account's users, causing fallback to first user or stale data.
3. **No profile selection step after upload**: `AddAccountDialog` goes straight from parse → create with no opportunity to choose which employees become sign-in personas.

## Changes

### 1. `src/components/account/AddAccountDialog.tsx` — Add profile selection step

After JSON parse + validation, add a second step before account creation:

- **Step 1** (existing): Upload JSON, show summary (name, employee count, warnings)
- **Step 2** (new): "Choose sign-in profiles" screen
  - List all employees from the parsed JSON in a scrollable list
  - Each row: checkbox, name, title, inferred manager status
  - Role type selector per checked employee: Admin / Manager / Learner (default inferred from reportsTo)
  - If JSON already has a `users` section, pre-check those employees
  - If no `users` section, nothing pre-checked — user must explicitly select
  - "Create Account" button at bottom, disabled if zero selected
- When creating: override `usersById` in the JSON data to only include selected employees with chosen roles, then call `addAccount`

### 2. `src/contexts/UserContext.tsx` — Account-scoped signed-in state

- Change localStorage key from flat `signedInUsers` to per-account: `signedInUsers_${activeAccountId}`
- When account switches, read the correct per-account signed-in set
- On account creation, pre-populate that account's signed-in set with the selected profile IDs from the upload dialog
- Add `setInitialSignedInUsers(accountId, userIds)` to context API so AddAccountDialog can seed the signed-in set for the new account

### 3. `src/lib/accountParser.ts` — Stop auto-creating users from all employees

- Remove lines 99-112 that auto-create users from every employee
- Instead, keep `usersById` empty if JSON has no `users` section
- The AddAccountDialog profile selection step will handle user creation explicitly

### 4. `src/contexts/AccountContext.tsx` — Pass selected users through addAccount

- Extend `addAccount` to accept an optional `selectedUsers: AccountUser[]` parameter
- When building the normalized account, use the provided users instead of auto-generated ones
- Store selected users in the JSONB `data.users` field so they persist

### 5. `src/components/layout/AppSidebar.tsx` — No code changes needed

Profile switcher already reads from `useUser().availableUsers` which will now be account-scoped. The filtering happens upstream.

## Files Modified

| File | Change |
|------|--------|
| `src/components/account/AddAccountDialog.tsx` | Add step 2: profile selection UI with checkboxes + role selectors |
| `src/contexts/UserContext.tsx` | Account-scoped localStorage keys for signed-in state; add `setInitialSignedInUsers` |
| `src/lib/accountParser.ts` | Remove auto-user-creation from employees; let it stay empty |
| `src/contexts/AccountContext.tsx` | Accept selected users in `addAccount`; embed in data blob |

## UI for Profile Selection Step

```text
┌─────────────────────────────────────────┐
│  Choose sign-in profiles                │
│  Select which people become available   │
│  in the profile switcher.               │
│                                         │
│  ☐ Sarah Chen — VP Operations           │
│    [Manager ▾]  👑 has direct reports    │
│  ☐ James Liu — Senior Analyst           │
│    [Learner ▾]                          │
│  ☐ Priya Sharma — Team Lead             │
│    [Manager ▾]  👑 has direct reports    │
│  ☐ Tom Williams — Associate             │
│    [Learner ▾]                          │
│                                         │
│  [ Create "Acme Corp" ]  (disabled if 0)│
└─────────────────────────────────────────┘
```

## Data Flow After Fix

```text
Upload JSON → Parse → Profile Selection Step
                         ↓
              User picks 2 employees as personas
                         ↓
              addAccount(name, data, selectedUsers)
                         ↓
              Store selectedUsers in data.users
              Normalize with ONLY those users
                         ↓
              Seed signedInUsers_{accountId} in localStorage
                         ↓
              Switch to new account
                         ↓
              UserContext reads account-scoped signed-in set
              Profile switcher shows ONLY selected personas
```

