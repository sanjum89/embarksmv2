

# Auto-Generate Realistic Reflections for Uploaded Accounts

## What This Does

When an uploaded account (like Rathbones) has employees but no `reflections` array, the system will auto-generate realistic, employee-linked reflection entries. These represent employees sharing their own voice — what's going well, what's frustrating, what they're working on, and how they feel about their work.

Each reflection is tied to its `employeeId`, so it can be used across the app (Admin Reflections tab, Employee Detail Panel, and potentially My360 or Manager views).

## Plan

### Step 1: Create reflection derivation module
**New file: `src/lib/adminDataDerivation.ts`**

Create a `deriveReflections(employees)` function that generates 2–4 reflection entries per employee based on their attributes:

- **Content** is templated from the employee's `arc`, `risk`, `fn` (function), `tenure`, and `aspiration` fields — producing first-person statements about work experience, challenges, wins, and frustrations
- **Confidence** (1–5): derived from risk level (High → 2, Medium → 3, Low → 4) with slight variance
- **Workload** (1–5): derived from tenure (newer = higher workload) and risk
- **Sentiment**: mapped from risk/arc tone (e.g., "frustrated", "positive", "mixed")
- **Themes**: extracted from the employee's arc keywords and function (e.g., "onboarding pace", "client complexity", "regulatory pressure", "team support")
- **Dates**: spread across recent weeks
- **Manager feedback**: included on some entries (especially for flagged employees)

Example output for Theo Redgrave (High risk, tenure 2):
```
{
  id: "ref-RAT-E011-1",
  employeeId: "RAT-E011",
  date: "2026-03-15",
  confidence: 2,
  workload: 5,
  sentiment: "frustrated",
  themes: ["workload", "confidence", "execution pressure"],
  content: "I feel like I'm constantly behind. The volume of client work has been relentless and I'm not sure my output quality is where it should be.",
  managerFeedback: "Theo needs a workload review — consider redistributing 1-2 client accounts."
}
```

### Step 2: Integrate into account normalization
**File: `src/lib/accountParser.ts`** or **`src/contexts/AccountContext.tsx`**

After parsing, if `reflections` array is empty but employees have rich data (arc, risk, tenure fields), call `deriveReflections()` to populate it. This ensures:
- Rathbones and any future uploaded account gets reflections automatically
- Default account keeps its hand-crafted reflections
- All reflections are properly linked via `employeeId`

### Step 3: Verify panel rendering
**File: `src/components/admin/ReflectionsPanel.tsx`** — no changes needed; it already reads from `getReflections(account)` and displays employee names via `employeesById[entry.employeeId]`.

**File: `src/components/admin/EmployeeDetailPanel.tsx`** — already calls `getReflectionSummary(account, row.employeeId)` for per-employee reflection data.

### Files Modified
- **New**: `src/lib/adminDataDerivation.ts` — reflection generation logic
- **Edit**: `src/lib/accountParser.ts` or `src/contexts/AccountContext.tsx` — call derivation when reflections are empty

### Files NOT Modified
- `ReflectionsPanel.tsx`, `EmployeeDetailPanel.tsx` — already wired correctly
- `account-v2.ts` — `ReflectionEntry` type already has all needed fields
- `accountSelectors.ts` — `getReflections` and `getReflectionSummary` already support filtering by employeeId

