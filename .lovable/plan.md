

# Improve Account Creation Flow

## What Changes

Expand the `AddAccountDialog` from 2 steps (upload → profiles) to 4 steps:

1. **Upload** — keep as-is
2. **Validation + Parse Summary** — new dedicated review step showing detected/missing sections
3. **Persona Selection** — enhance existing step with role editing, hierarchy context, reportsTo info
4. **Choose Initial Persona** — new step to pick who to sign in as first

## Technical Plan

### File: `src/components/account/AddAccountDialog.tsx`

**Step type change:**
```typescript
type Step = "upload" | "review" | "profiles" | "initial";
```

**Step 2 — Review screen** (new, between upload and profiles):
- Show account name, schema version, employee count, user count
- Categorized section checklist with status badges:
  - **Required** (name, employees/users) — green check or red error
  - **Learning** (skillTargets, learningModules, assessments, rolePlays) — detected/missing
  - **Admin/Team** (companyProfile, siteProfile, reflections, workSignals, showcaseCases, explainability, org, signals, architectureSources) — detected/missing
  - **Other** (prompts, hierarchy, profileData, projects, rolesCatalog)
- For missing optional sections: yellow "not provided" badge
- For profileData specifically: if missing but employees have skills, show "Will be generated from employee data"
- For missing learning/content sections: explicitly state "Empty — no demo data will be injected"
- Errors block the "Next" button; warnings don't
- "Next: Choose Profiles →" button

**Step 3 — Persona Selection** (enhance existing):
- Add role selector dropdown (Admin / Manager / Learner) per row using existing `Select` component — the `setEmployeeRole` function already exists but isn't wired to UI
- Show `reportsTo` name (look up from employee data) as subtitle context
- Show "Has N direct reports" if applicable
- Show suggested role with "(suggested)" label next to the inferred value
- Keep existing checkbox selection behavior (none pre-selected)

**Step 4 — Choose Initial Persona** (new):
- Show only the selected profiles from step 3
- Radio-button selection for "Sign in as"
- Pre-select the first admin, or first manager, or first selected person
- "Create Account" button (moves the existing create logic here)
- Block if no selection

**On create:**
- After `addAccount` and `setInitialSignedInUsers`, also call `switchUser` on the chosen initial persona so the app immediately activates that identity
- This requires passing the initial persona ID back — the `handleCreate` callback already has access to `switchUser` via the `useUser` hook (need to destructure it)

### File: `src/contexts/UserContext.tsx`

No changes needed — `switchUser` and `setInitialSignedInUsers` already exist and handle everything.

### Parser enhancement for review data

Add a helper to `parseAccountJSON` or extract from the existing parse result to produce a structured "detection summary" object:

```typescript
interface ParseSectionStatus {
  key: string;
  label: string;
  category: "required" | "learning" | "admin" | "other";
  detected: boolean;
  count?: number; // array length if applicable
  note?: string;  // e.g. "Will be generated from employee data"
}
```

This can be computed in the dialog from the raw JSON + parse warnings without changing the parser itself — just inspect `json.skillTargets`, `json.reflections`, etc. directly.

### Files Modified
- `src/components/account/AddAccountDialog.tsx` — main changes (4-step flow, review UI, role selector, initial persona picker)

### Files NOT Modified
- No parser changes needed
- No context changes needed
- No route/page/layout changes
- No backend changes

