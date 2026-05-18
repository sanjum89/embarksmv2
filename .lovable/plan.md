# Fix Cohort headers + replace raw codes with human labels

## What's wrong today

**Headers (inconsistency with the new standard):**
- `ManagerCohortPicker` (`/manager/cohorts`) still passes `eyebrow` and `back` to `<PageHeader>` — pre-standardization style.
- `ManagerCohortHub` (`/manager/cohort/:cohortId`) does the same and never passes `breadcrumbs`, so the trailing crumb defaults to the generic label "Cohort" instead of the cohort title.

**Confusing strings on the inner cohort page:**
- `cohort.assoc_im.2026_01` is the internal `cohort_code` (system slug = role · intake).
- The pill `assoc IM` is `role_cohort_code` (`assoc_im` = Associate Investment Manager) shown raw with an underscore.

Neither is meaningful to a user — they're database identifiers leaking into the UI.

## Changes

### 1. `src/pages/ManagerCohortPicker.tsx`
- Remove `eyebrow` and `back` props from `<PageHeader>` (auto-breadcrumbs from `CRUMB_MAP["/manager/cohorts"]` = "Cohorts" will take over).
- Card pill: replace raw `c.role_cohort_code` with human label via a `roleCohortLabel()` helper (e.g. `assoc_im` → "Associate Investment Manager", `senior_im` → "Senior Investment Manager", etc.). Fallback: title-case the slug.
- Drop the `cohort.assoc_im.2026_01` code from the card UI (it adds no value); keep `cohort_title` as the primary line.

### 2. `src/pages/ManagerCohortHub.tsx`
- Remove `eyebrow` and `back` from all three `<PageHeader>` instances.
- Pass explicit `breadcrumbs={[{ label: "Cohorts", to: "/manager/cohorts" }, { label: cohort.cohort_title }]}` so the trailing crumb is the cohort's friendly title.
- Rebuild `subtitleNode`:
  - Drop the raw `cohort.cohort_code` token.
  - Replace the raw `role_cohort_code` badge with the human label from `roleCohortLabel()`.
  - Keep start/due dates.
- Loading / not-found states use the same breadcrumbs (with `{ label: "…" }` as the trailing crumb while loading).

### 3. New helper `src/lib/roleCohortLabel.ts`
Single source of truth mapping role-cohort slugs to display labels. Used by both pages above and available for future cohort surfaces.

```ts
const MAP: Record<string, string> = {
  assoc_im: "Associate Investment Manager",
  senior_im: "Senior Investment Manager",
  inv_dir:   "Investment Director",
  // …extend as needed
};
export function roleCohortLabel(code?: string | null): string {
  if (!code) return "";
  return MAP[code] ?? code.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
```

### 4. Sweep verification (no edits expected)
Spot-checked other inner pages reachable from Cohorts/Team:
- `DeepResearch`, `TeamMode`, `ManagerSkillTargets`, `CohortHub` — already on the new `<PageHeader>` pattern without `eyebrow`/`back`.
- `LearnerDrawer` is a side sheet, not a page — out of scope.

If during implementation any other inner page is found still using `eyebrow`/`back`, it will be migrated the same way (remove props, add explicit `breadcrumbs` with the resolved entity title).

## Out of scope
- No data-model changes. `cohort_code` / `role_cohort_code` remain in the DB and types untouched; only their UI presentation changes.
- No new routes.
