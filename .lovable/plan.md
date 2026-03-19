

# Full Backend for Multi-Account Demo System

## Approach: JSONB-Document Storage

Given this is a demo system (20 accounts, ~100 employees each) with JSON upload as the creation path, a **document-oriented approach** is the most practical. Instead of 15+ normalized tables with complex joins, we store each account's full dataset as a JSONB document alongside metadata columns for querying.

This maps perfectly to the JSON upload workflow — uploaded JSON goes directly into a row.

## Database Schema

### Migration 1: Accounts table

```sql
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text,           -- URL or data URI
  accent_color text,   -- hex color
  use_case_context text,
  is_default boolean DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Public read for demo (no auth required)
CREATE POLICY "Anyone can read accounts"
  ON public.accounts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update accounts"
  ON public.accounts FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete non-default accounts"
  ON public.accounts FOR DELETE
  USING (is_default = false);
```

The `data` JSONB column holds:
- `employees` (with reportsTo)
- `skillTargets`, `rolePlays`, `assessments`, `learningModules`
- `programContexts`, `newHires`, `teamMembers`
- `profileData`, `aiManagerConfig`, `prompts`

### Migration 2: Seed default account

Insert the current mock data as the default account (built from existing `mock.ts` data).

## Files to Create

### 1. `src/types/account.ts`
- `Account` interface matching the DB shape
- `AccountData` interface for the JSONB `data` field (employees, skillTargets, rolePlays, etc.)
- `AccountEmployee` extending `User` with `reportsTo`

### 2. `src/contexts/AccountContext.tsx`
- Fetches accounts from database on mount
- State: `accounts`, `activeAccountId`, `activeAccount` (derived)
- Methods: `switchAccount`, `addAccount` (inserts to DB), `deleteAccount` (deletes from DB)
- Seeds default account on first load if none exists
- Provides `useAccount()` hook

### 3. `src/lib/accountDefaults.ts`
- `buildDefaultAccountData()` — packages current mock data into the `AccountData` shape
- `generateFallbackData(partial)` — fills missing fields in uploaded JSON
- Sets hierarchy: Maya→Alex, Raj→Alex, Emma→Marcus

### 4. `src/lib/accountHierarchy.ts`
- `buildOrgTree(employees)` — flat reportsTo list → tree
- `getDirectReports(userId, employees)` / `getTeamMembers(userId, employees)`

### 5. `src/components/account/AccountSwitcher.tsx`
- Popover in sidebar showing current account + list of all accounts
- Switch / Add / Delete actions
- Add triggers JSON upload dialog

### 6. `src/components/account/AddAccountDialog.tsx`
- JSON file upload → validate → insert into `accounts` table
- Shows success/error feedback

## Files to Modify

### 7. `src/App.tsx`
- Wrap with `<AccountProvider>`

### 8. `src/contexts/UserContext.tsx`
- Read `availableUsers` from active account's `data.employees`
- Reset current user when account switches

### 9. `src/contexts/SkillTargetsContext.tsx`
- Initialize from `activeAccount.data.skillTargets`

### 10. `src/contexts/RolePlayContext.tsx`
- Initialize from `activeAccount.data.rolePlays`

### 11. `src/components/layout/AppSidebar.tsx`
- Add `<AccountSwitcher />` in brand/logo area
- Show active account logo + name

### 12. `src/data/mock.ts`
- Update hierarchy: Maya(u6)→Alex(u1), Raj(u8)→Alex(u1), Emma(u10)→Marcus(u7)

## Why JSONB Instead of Normalized Tables

- **20 accounts × ~100 employees** = trivial data volume for JSONB
- JSON upload maps 1:1 to a DB row — no complex ETL
- No joins needed — single query fetches everything
- Adding new data types to accounts requires zero schema changes
- Demo-friendly: easy to inspect, export, debug
- If the system later needs to scale to production, normalize then

## Performance

- Each account's JSONB blob is ~50-200KB — well within Postgres limits
- Single query to load active account
- Switching accounts = one DB read
- RLS is permissive (demo system, no auth required)

